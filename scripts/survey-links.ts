// 템플릿 현황 조사 v2 (T6 사전 작업) — 세 경로에서 자료 링크를 수집한다:
//  ① 영상 설명란의 직접 구글 링크
//  ② 설명란의 블로그(cho-ai-lab.blogspot.com)·단축링크(link.cho-ai.com 등) → 따라가서 내부의 구글 링크 추출
//  ③ 고정댓글(채널 소유자 댓글) — YouTube commentThreads API
// 읽기 전용 — DB에 쓰지 않는다. 결과: docs/template-inventory.md
import { writeFileSync } from 'node:fs';
import { sql } from '../src/db/client';

const API_KEY = process.env.YOUTUBE_API_KEY!;
const OWNER = 'UCiBi0s6g_Uk3k8yhCmkH5xw';

const URL_RE = /https?:\/\/[^\s)\]"'<>»‥…]+/g;
const clean = (u: string) => u.replace(/[.,;!?)»]+$/, '');
const fileKey = (u: string) => (u.match(/\/(?:d|forms\/d\/e?|file\/d)\/([-\w]{20,})/) ?? [])[1] ?? u;

function classify(u: string): string | null {
  if (/docs\.google\.com\/spreadsheets/.test(u)) return 'sheet';
  if (/docs\.google\.com\/document/.test(u)) return 'doc';
  if (/docs\.google\.com\/presentation/.test(u)) return 'slides';
  if (/docs\.google\.com\/forms|forms\.gle/.test(u)) return 'form';
  if (/drive\.google\.com/.test(u)) return 'drive';
  return null;
}
const SHORT_RE = /^https?:\/\/(link\.cho-ai\.com|bit\.ly|buly\.kr|vo\.la|han\.gl|url\.kr|me2\.do|naver\.me|c11\.kr|zrr\.kr|tinyurl\.com|goo\.gl|t\.ly|litt\.ly|lrl\.kr|abit\.ly)\//;
const BLOG_RE = /^https?:\/\/cho-ai-lab\.blogspot\.com\//;

async function follow(u: string): Promise<string> {
  let cur = u;
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(cur, { redirect: 'manual' });
      const loc = res.headers.get('location');
      if (!loc) break;
      cur = new URL(loc, cur).toString();
    } catch { break; }
  }
  // 구글 로그인 래퍼(accounts.google.com)에 도착하면 continue 파라미터가 실제 목적지
  try {
    const p = new URL(cur);
    if (p.hostname === 'accounts.google.com') {
      const cont = p.searchParams.get('continue') ?? p.searchParams.get('followup');
      if (cont) return decodeURIComponent(cont);
    }
  } catch { /* noop */ }
  return cur;
}

const pageCache = new Map<string, string[]>();
async function googleLinksInPage(url: string): Promise<string[]> {
  if (pageCache.has(url)) return pageCache.get(url)!;
  let links: string[] = [];
  try {
    const html = await (await fetch(url)).text();
    links = [...new Set((html.match(URL_RE) ?? []).map(clean).map((u) => u.replace(/&amp;.*$/, '')).filter((u) => classify(u)))];
  } catch { /* 페이지 접근 실패는 비고로 남김 */ }
  pageCache.set(url, links);
  return links;
}

async function ownerCommentUrls(videoId: string): Promise<string[]> {
  try {
    const q = new URLSearchParams({ part: 'snippet', videoId, maxResults: '25', order: 'relevance', key: API_KEY });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${q}`);
    if (!res.ok) return [];
    const data = await res.json();
    const urls: string[] = [];
    for (const t of data.items ?? []) {
      const s = t.snippet.topLevelComment.snippet;
      if (s.authorChannelId?.value !== OWNER) continue;
      const text = (s.textOriginal ?? s.textDisplay ?? '') as string;
      urls.push(...(text.match(URL_RE) ?? []).map(clean));
    }
    return [...new Set(urls)];
  } catch { return []; }
}

type Found = { no: number; title: string; url: string; kind: string; source: string; via?: string };
const found: Found[] = [];
const seen = new Set<string>(); // video_no + fileKey 중복 방지

async function handleUrl(no: number, title: string, raw: string, source: string) {
  const u = clean(raw);
  const kind = classify(u);
  if (kind) {
    const k = `${no}:${fileKey(u)}`;
    if (!seen.has(k)) { seen.add(k); found.push({ no, title, url: u, kind, source }); }
    return;
  }
  if (SHORT_RE.test(u)) {
    const target = await follow(u);
    const tk = classify(target);
    if (tk) {
      const k = `${no}:${fileKey(target)}`;
      if (!seen.has(k)) { seen.add(k); found.push({ no, title, url: clean(target), kind: tk, source: `${source}·단축`, via: u }); }
    } else if (BLOG_RE.test(target)) {
      for (const g of await googleLinksInPage(target)) await handleUrl(no, title, g, `${source}·단축→블로그`);
    }
    return;
  }
  if (BLOG_RE.test(u)) {
    const links = await googleLinksInPage(u);
    for (const g of links) {
      const k = `${no}:${fileKey(g)}`;
      if (!seen.has(k)) { seen.add(k); found.push({ no, title, url: g, kind: classify(g)!, source: `${source}→블로그`, via: u }); }
    }
    if (!links.length) found.push({ no, title, url: u, kind: 'blog(추출실패)', source });
  }
}

const rows = (await sql`SELECT id, video_no, title, description FROM videos ORDER BY video_no`) as any[];
for (const v of rows) {
  const urls = [...new Set(((v.description ?? '').match(URL_RE) ?? []).map(clean))] as string[];
  for (const u of urls) await handleUrl(v.video_no, v.title, u, '설명란');
  for (const u of await ownerCommentUrls(v.id)) await handleUrl(v.video_no, v.title, u, '고정댓글');
  process.stdout.write(`\r#${v.video_no} 조사 중…  `);
}
console.log('');

// ③ 블로그 전체 크롤 — 글 속 유튜브 영상과 구글 자료를 직접 매칭 (설명란에 블로그 링크가 없어도 잡힘)
const byVideoId = new Map(rows.map((v) => [v.id, v]));
try {
  const sitemap = await (await fetch('https://cho-ai-lab.blogspot.com/sitemap.xml')).text();
  const postUrls = [...new Set(sitemap.match(/https:\/\/cho-ai-lab\.blogspot\.com\/\d{4}\/\d{2}\/[^<\s]+/g) ?? [])];
  console.log(`블로그 글 ${postUrls.length}개 크롤 중…`);
  for (const post of postUrls) {
    let html = '';
    try { html = await (await fetch(post)).text(); } catch { continue; }
    const ytIds = [...new Set([...(html.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([-\w]{11})/g) ?? [])]
      .map((m) => m.slice(-11)))];
    const gLinks = [...new Set((html.match(URL_RE) ?? []).map(clean).map((u) => u.replace(/&amp;.*$/, '')).filter((u) => classify(u)))];
    if (!gLinks.length) continue;
    for (const yid of ytIds) {
      const v = byVideoId.get(yid);
      if (!v) continue;
      for (const g of gLinks) await handleUrl(v.video_no, v.title, g, `블로그 글 매칭(${post.split('/').pop()})`);
    }
  }
} catch (e) {
  console.warn('블로그 크롤 실패:', (e as Error).message);
}

const byFile = new Map<string, Found[]>();
for (const f of found.filter((f) => !f.kind.startsWith('blog'))) {
  byFile.set(fileKey(f.url), [...(byFile.get(fileKey(f.url)) ?? []), f]);
}
const vidsWith = new Set(found.map((f) => f.no));
const kinds = ['sheet', 'doc', 'slides', 'form', 'drive'];
const kindCount = Object.fromEntries(kinds.map((k) => [k, new Set(found.filter((f) => f.kind === k).map((f) => fileKey(f.url))).size]));

let md = `# 템플릿 현황 조사 — 설명란·블로그·고정댓글 전수 (T6 사전 조사)

생성: scripts/survey-links.ts (재실행 가능) · 경로: 설명란 직링크 + 블로그(cho-ai-lab.blogspot.com) 내부 + link.cho-ai.com 등 단축 + 채널 소유자 고정댓글

## 요약

- 자료가 확인된 영상: **${vidsWith.size} / ${rows.length}편**
- 고유 자료: 시트 ${kindCount.sheet} · 문서 ${kindCount.doc} · 슬라이드 ${kindCount.slides} · 폼 ${kindCount.form} · 드라이브 ${kindCount.drive}
- 여러 영상이 공유하는 자료: ${[...byFile.values()].filter((v) => new Set(v.map((x) => x.no)).size > 1).length}개

## 영상별 자료

| # | 영상 | 유형 | 출처 | 링크 | 비고 |
|---|---|---|---|---|---|
`;
for (const f of found) {
  const dup = f.kind.startsWith('blog') ? new Set([f.no]) : new Set(byFile.get(fileKey(f.url))!.map((x) => x.no));
  const memo = [f.via ? `경유: ${f.via}` : '', dup.size > 1 ? `공유: #${[...dup].join(' #')}` : ''].filter(Boolean).join(' · ');
  md += `| ${f.no} | ${f.title.slice(0, 26).replace(/\|/g, '/')} | ${f.kind} | ${f.source} | ${f.url} | ${memo} |\n`;
}
md += `\n## 자료 미확인 영상 (갤러리 노출 대상 아님 후보)\n\n`;
md += rows.filter((v) => !vidsWith.has(v.video_no)).map((v) => `- #${v.video_no} ${v.title.slice(0, 40)}`).join('\n') + '\n';

writeFileSync('docs/template-inventory.md', md);
console.log(`완료 — 자료 확인 영상 ${vidsWith.size}편, 링크 ${found.length}건 → docs/template-inventory.md`);
await sql.end();
