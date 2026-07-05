// templates 시딩 — docs/template-inventory.md 조사(2026-07-05) 기반 초기 24개.
// slug는 영구 불변 (CLAUDE.md 규칙 1). 제목은 구글 파일 실제 제목에서 정리. 재실행 안전(upsert).
// 신규 자료는 이 스크립트가 아니라 template-registration 절차로 등록한다.
import { sql } from '../src/db/client';

type T = {
  slug: string; title: string; type: 'sheet' | 'doc' | 'form' | 'file';
  fileId: string; videos: number[]; auth: boolean;
  status?: 'draft' | 'published'; note?: string;
};

const copyUrl = (t: T) =>
  t.type === 'sheet' ? `https://docs.google.com/spreadsheets/d/${t.fileId}/copy`
  : t.type === 'doc' ? `https://docs.google.com/document/d/${t.fileId}/copy`
  : t.type === 'form' ? `https://docs.google.com/forms/d/${t.fileId}/copy`
  : `https://drive.google.com/uc?export=download&id=${t.fileId}`;

const DATA: T[] = [
  // ── 시트 15
  { slug: 'youtube-video-collector-basic', title: '유튜브 영상 수집 기초 시트', type: 'sheet', fileId: '1184lmXcqRVBmnQFcruEdgX7LDUhctYcXsjx4RbnoyCw', videos: [12, 13, 14], auth: true },
  { slug: 'sheet-splitter-1', title: '시트나누기 자동화 (1개 신청)', type: 'sheet', fileId: '12_8Dtw_T8HSz9omcdS7aLb_JmjXnOl8xaO-Tg-RI7yU', videos: [27], auth: true },
  { slug: 'sheet-splitter-2', title: '시트나누기 자동화 (2개 신청)', type: 'sheet', fileId: '1AgHTjbRf64s7wGx7hFKmkO-tye4gIrtqYPfjRtqi3zY', videos: [27], auth: true },
  { slug: 'sheet-splitter-3', title: '시트나누기 자동화 (3개 신청)', type: 'sheet', fileId: '12ndXJ99o1lO-DSZ6jo-Zi-kp8NfCYd_snz80Ych-Lp8', videos: [27], auth: true },
  { slug: 'channel-benchmark-sheet', title: '벤치마킹 채널 영상 수집·분석 시트', type: 'sheet', fileId: '1W2N6Z_jkrKyO6o3srrgZXpEaIui9bOVwi5RA0u8ElO0', videos: [28], auth: true },
  { slug: 'flashcard-v1', title: '플래시카드 시트 v1.0', type: 'sheet', fileId: '19CiEUiGCKMTMBNkJEYx1IGy_p_PFD3Z48FNyuhUp1Pw', videos: [34], auth: false },
  { slug: 'flashcard-v2', title: '플래시카드 시트 v2.0', type: 'sheet', fileId: '1t9cu_3K72r6lnQ_vFJrU1PKJRmej1bHpIR-4xbfURrc', videos: [34], auth: false },
  { slug: 'mobile-flashcard-basic', title: '모바일용 플래시카드 (기본버전)', type: 'sheet', fileId: '1TSHWh6ha4oApqT6KZ2t0I44nGQkxU330Vr0sU4hgX7Q', videos: [36, 37], auth: true },
  { slug: 'mobile-flashcard-fast', title: '모바일용 플래시카드 (빠른단순버전)', type: 'sheet', fileId: '1A18dFbjjhQWqRGoTgELvqOupySGaz_37jFtBsO58fOA', videos: [36, 37], auth: true },
  { slug: 'ai-study-system', title: 'AI 공부 자동화 시스템', type: 'sheet', fileId: '1sOAvpSt3y6Chz0CkSRV5j0iNh-_TCQa-YB3DmiJ3wJ4', videos: [38], auth: true },
  { slug: 'cafe-data-integrator', title: '카페 지점별 데이터 통합 시트', type: 'sheet', fileId: '13JWQFWND-xt5ZG79zvSfOdgGATbB2_gJ1rns-_dKTss', videos: [63], auth: true },
  { slug: 'automation-school-10-extra', title: '시트나누기 자동화 템플릿 (AI자동화학교 10강)', type: 'sheet', fileId: '1qpxwZ5ZOuWClFsP29RPiaenqfg1eSaL2fcJbAfCvF1k', videos: [63], auth: true },
  { slug: 'comment-collector-c', title: '유튜브 댓글 수집 시트 (C버전)', type: 'sheet', fileId: '1ALHYTaBbuTaECzrpFRux9pmZXYUpjNqwcUJucb9XW78', videos: [83, 84], auth: true },
  { slug: 'comment-collector-g', title: '유튜브 댓글 수집 시트 (G버전)', type: 'sheet', fileId: '1fGSYE8fbXalVZmaK0IvAHAc-lB3RIukXCI9SQdpPfYg', videos: [83, 84], auth: true },
  { slug: 'king-youtube-sheet', title: '킹왕짱 유튜브시트 v2.0', type: 'sheet', fileId: '15cV4acDHxz3rAQUulDLRjGldNFDZxhK_zJ9YCifjwwY', videos: [18], auth: true },
  // ── 문서 7
  { slug: 'form-generator-code', title: '설문지 생성·맞춤형 이메일 자동화 코드', type: 'doc', fileId: '1ld9PBTSuG9yKBSBkfk7tslllKOzbldUcES0W7ejPOi4', videos: [16], auth: false },
  { slug: 'comment-collector-code', title: '유튜브 댓글 수집 코드', type: 'doc', fileId: '1ES_1theSAVYPw8BSZw1uKgvR4WJLCILlvXQ-QEd7mfY', videos: [17], auth: false },
  { slug: 'sms-sender-guide', title: '문자 보내기·구글문서 자동 생성 강의안', type: 'doc', fileId: '1HRlZw7ugRT_B8ugGPf31B6k3EVOPwxmu9utSMkUT5GY', videos: [21], auth: false },
  { slug: 'automation-school-01-02', title: 'AI자동화학교 01·02강 강의안', type: 'doc', fileId: '1NfvmzxPR_Fwjs4y6xGLz9MAt9T0XJwcU5x_3bqdyi6c', videos: [35, 36], auth: false },
  { slug: 'api-dashboard-guide', title: '구글시트 외부 API 연동 대시보드 강의안', type: 'doc', fileId: '1ByHFDe9DjfVJkjj_lqn3cQcRKDkt4M7SSN6enI5AaSQ', videos: [76], auth: false },
  { slug: 'youtube-api-guide', title: '유튜브 API 키 발급 강의안', type: 'doc', fileId: '1XaV9GLDACvs-ssyD-OpMUgN1a3L_9KOaSnViSJNuK3Q', videos: [81, 82], auth: false },
  { slug: 'super-youtube-sheet-notebooklm', title: '슈퍼유튜브시트 노트북LM 활용 문서', type: 'doc', fileId: '1qZaXhy_YToxSlvreIMNOqEM150xiZVTkonViZ57zaEM', videos: [80], auth: false },
  // ── 폼 1 · 파일 1
  { slug: 'diary-form', title: '일기 자동화 설문지', type: 'form', fileId: '1mRaEb_j6DnfR3OJ9iKxJpH-HlfzPb7D9tbcilqOF77s', videos: [8, 9], auth: false },
  { slug: 'slack-webhook-guide', title: '슬랙 웹훅 설정 가이드 (다운로드)', type: 'file', fileId: '15oE2HA13VvL7W0ZdDdGRMeMSje6KwpKK', videos: [32], auth: false },
];

const vids = await sql`SELECT id, video_no FROM videos`;
const vidId = new Map(vids.map((v: any) => [v.video_no, v.id]));

let linked = 0;
for (const t of DATA) {
  await sql`
    INSERT INTO templates (slug, title, type, status, copy_url, requires_auth, body_md)
    VALUES (${t.slug}, ${t.title}, ${t.type}, ${t.status ?? 'published'}, ${copyUrl(t)}, ${t.auth}, ${t.note ?? null})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, type = EXCLUDED.type, copy_url = EXCLUDED.copy_url,
      requires_auth = EXCLUDED.requires_auth, updated_at = now()`;
  for (const no of t.videos) {
    const vid = vidId.get(no);
    if (!vid) { console.warn(`⚠️ #${no} 영상 없음 (${t.slug})`); continue; }
    const r = await sql`INSERT INTO video_templates (video_id, template_slug) VALUES (${vid}, ${t.slug}) ON CONFLICT DO NOTHING`;
    linked += r.count;
  }
  // 템플릿 태그: 첫 연결 영상의 태그를 상속 (초안 — 개별 검수 대상)
  const firstVid = vidId.get(t.videos[0]);
  if (firstVid) {
    await sql`INSERT INTO template_tags (template_slug, tag_id)
      SELECT ${t.slug}, tag_id FROM video_tags WHERE video_id = ${firstVid}
      ON CONFLICT DO NOTHING`;
  }
}
const [{ tc }] = await sql`SELECT count(*)::int AS tc FROM templates`;
const [{ vc }] = await sql`SELECT count(*)::int AS vc FROM video_templates`;
const [{ gc }] = await sql`SELECT count(*)::int AS gc FROM template_tags`;
console.log(`templates ${tc}개 · video_templates ${vc}행(신규 ${linked}) · template_tags ${gc}행`);
await sql.end();
