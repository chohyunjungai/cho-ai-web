// 영상 동기화 — YouTube Data API(읽기 키) → videos upsert + video_no 부여 + short_links 생성.
// 규칙 (SPEC.md §3):
//  - video_no는 게시일 오름차순 연번. 기존 행의 번호는 절대 건드리지 않는다 (upsert 시 video_no 미갱신).
//  - 신규 영상은 트랜잭션 안에서 max(video_no)+1 부터 게시일 순으로 부여.
//  - 영상마다 short_links 3행: {no}(other), {no}d(description), {no}c(comment) → /videos/{videoId}
//  - API 응답에서 사라진 영상은 삭제/비공개 구분이 불가(공개 데이터 API 한계) → 상태를 임의로 바꾸지 않고 경고만 출력.
import 'dotenv/config';
import { asc, sql as dsql } from 'drizzle-orm';
import { db, sql } from '../src/db/client';
import { videos, shortLinks } from '../src/db/schema';

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL = process.env.YT_CHANNEL; // '@handle' 또는 'UC...' 채널 ID
if (!API_KEY || !CHANNEL) throw new Error('YOUTUBE_API_KEY, YT_CHANNEL 환경변수가 필요합니다.');

const API = 'https://www.googleapis.com/youtube/v3';

async function yt(path: string, params: Record<string, string>) {
  const q = new URLSearchParams({ ...params, key: API_KEY! });
  const res = await fetch(`${API}/${path}?${q}`);
  if (!res.ok) throw new Error(`YouTube API ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

// 1) 채널 → 업로드 재생목록
const chParams: Record<string, string> =
  CHANNEL.startsWith('UC') ? { id: CHANNEL } : { forHandle: CHANNEL };
const ch = await yt('channels', { part: 'contentDetails', ...chParams });
if (!ch.items?.length) throw new Error(`채널을 찾을 수 없습니다: ${CHANNEL}`);
const uploadsId: string = ch.items[0].contentDetails.relatedPlaylists.uploads;

// 2) 업로드 전체 videoId 수집
const ids: string[] = [];
let pageToken = '';
do {
  const page = await yt('playlistItems', {
    part: 'contentDetails', playlistId: uploadsId, maxResults: '50',
    ...(pageToken ? { pageToken } : {}),
  });
  ids.push(...page.items.map((i: any) => i.contentDetails.videoId));
  pageToken = page.nextPageToken ?? '';
} while (pageToken);
console.log(`업로드 재생목록에서 ${ids.length}개 영상 확인`);

// 3) 상세 조회 (50개 배치)
type Item = { id: string; title: string; publishedAt: string; thumb: string; description: string; seconds: number };
const items: Item[] = [];
for (let i = 0; i < ids.length; i += 50) {
  const batch = await yt('videos', {
    part: 'snippet,contentDetails', id: ids.slice(i, i + 50).join(','), maxResults: '50',
  });
  for (const v of batch.items) {
    const th = v.snippet.thumbnails;
    items.push({
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumb: (th.maxres ?? th.high ?? th.medium ?? th.default).url,
      description: v.snippet.description ?? '',
      seconds: parseISODuration(v.contentDetails.duration),
    });
  }
}

function parseISODuration(d: string): number {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0)) : 0;
}

// 4) Shorts 판별: 3분 이하 영상만 /shorts/ URL 프로브 (200 유지 = Shorts, 리다이렉트 = 일반)
async function isShort(id: string, seconds: number): Promise<boolean> {
  if (seconds > 183) return false;
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${id}`, { redirect: 'manual' });
    return res.status === 200;
  } catch {
    return false; // 프로브 실패 시 일반 영상으로 간주, sync-verifier가 후검
  }
}

// 5) upsert + 신규 번호 부여 (트랜잭션)
const existing = new Set(
  (await db.select({ id: videos.id }).from(videos)).map((r) => r.id),
);
const fresh = items.filter((v) => !existing.has(v.id))
  .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)); // 게시일 오름차순

await db.transaction(async (tx) => {
  // 기존 행: 메타데이터만 갱신 (video_no·status는 건드리지 않음)
  for (const v of items.filter((v) => existing.has(v.id))) {
    await tx.update(videos).set({
      title: v.title, thumbnailUrl: v.thumb, description: v.description,
      syncedAt: dsql`now()`,
    }).where(dsql`${videos.id} = ${v.id}`);
  }

  if (fresh.length === 0) return;
  const [{ max }] = await tx.execute<{ max: number | null }>(
    dsql`SELECT max(video_no) AS max FROM videos`,
  );
  let no = (max ?? 0);

  for (const v of fresh) {
    no += 1;
    const short = await isShort(v.id, v.seconds);
    await tx.insert(videos).values({
      id: v.id, videoNo: no, title: v.title,
      publishedAt: new Date(v.publishedAt), thumbnailUrl: v.thumb,
      description: v.description, isShort: short, syncedAt: new Date(),
    });
    const target = `/videos/${v.id}`;
    await tx.insert(shortLinks).values([
      { slug: `${no}`,  videoId: v.id, position: 'other',       targetPath: target },
      { slug: `${no}d`, videoId: v.id, position: 'description', targetPath: target },
      { slug: `${no}c`, videoId: v.id, position: 'comment',     targetPath: target },
    ]).onConflictDoNothing();
    console.log(`신규 #${no} ${short ? '(Shorts) ' : ''}${v.title} → cho-ai.com/${no}d`);
  }
});

// 6) API에서 사라진 영상 경고 (상태는 자동 변경하지 않음 — 공개 API로는 deleted/private 구분 불가)
const apiIds = new Set(items.map((v) => v.id));
const missing = [...existing].filter((id) => !apiIds.has(id));
if (missing.length) {
  console.warn(`⚠️ API 응답에 없는 기존 영상 ${missing.length}건 — 수동 확인 필요:`, missing.join(', '));
}

const total = await db.$count(videos);
console.log(`동기화 완료 — videos ${total}행 (신규 ${fresh.length})`);
await sql.end();
