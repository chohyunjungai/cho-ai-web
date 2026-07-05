// video_tags 시딩 — docs/tag-mapping.md 확정본(2026-07-05, 영상 84편)을 코드로 옮긴 것.
// 재실행 안전(onConflictDoNothing). 신규 영상의 태그는 이 스크립트가 아니라 개별 등록 절차로.
import { sql } from '../src/db/client';

// video_no: [task 태그들, tech 태그들]
const MAP: Record<number, [string[], string[]]> = {
  1: [['ai-tools'], ['ai']], 2: [['ai-tools'], ['ai']], 3: [['ai-tools'], ['ai']],
  4: [[], []], 5: [['ai-tools'], ['ai']], 6: [['ai-tools'], ['ai']], 7: [[], []],
  8: [['survey'], ['forms', 'docs']],
  9: [['survey', 'admin'], ['forms', 'docs', 'apps-script']],
  10: [['ai-tools'], ['ai']],
  11: [['youtube'], ['apps-script']],
  12: [['youtube'], ['apps-script', 'external-api']],
  13: [['youtube'], ['external-api']],
  14: [['youtube'], ['apps-script', 'ai']],
  15: [['survey'], ['ai', 'forms', 'apps-script']],
  16: [['survey'], ['ai', 'forms', 'gmail']],
  17: [['youtube'], ['apps-script', 'external-api']],
  18: [['youtube'], ['apps-script']],
  19: [['youtube'], ['apps-script', 'external-api']],
  20: [['sms-alert'], ['external-api']],
  21: [['sms-alert'], ['apps-script', 'external-api']],
  22: [['youtube', 'data'], ['apps-script', 'external-api']],
  23: [['youtube'], ['apps-script', 'external-api']],
  24: [['admin'], ['gmail', 'apps-script']],
  25: [['ai-tools'], ['ai']], 26: [['ai-tools'], []],
  27: [['school', 'admin'], ['apps-script']],
  28: [['youtube', 'data'], ['apps-script', 'external-api']],
  29: [['data'], ['apps-script', 'external-api']],
  30: [['ai-tools'], ['ai']], 31: [['ai-tools'], ['ai']],
  32: [['sms-alert'], ['external-api']],
  33: [['sms-alert', 'survey'], ['forms', 'trigger']],
  34: [['ai-study'], ['formulas']],
  35: [['automation', 'schedule'], ['apps-script', 'calendar', 'forms']],
  36: [['automation'], ['apps-script']],
  37: [['ai-study'], ['apps-script', 'web-app']],
  38: [['ai-study'], ['ai']],
  39: [['ai-tools'], ['ai']],
  40: [['ai-tools'], ['ai', 'external-api']],
  41: [['survey'], ['apps-script', 'forms']],
  42: [['survey'], ['ai', 'forms', 'apps-script']],
  43: [['survey'], ['apps-script', 'forms']],
  44: [[], []], 45: [[], []],
  46: [['youtube'], []],
  47: [['youtube', 'ai-tools'], ['ai']],
  48: [['ai-tools'], ['ai']],
  49: [['youtube'], ['external-api']],
  50: [['youtube'], ['external-api']],
  51: [['ai-tools'], []], 52: [[], []],
  53: [['ai-tools'], []], 54: [['ai-tools'], []], 55: [['ai-tools'], []],
  56: [['automation'], ['apps-script', 'ai']],
  57: [['automation'], ['apps-script']],
  58: [['automation'], ['apps-script', 'trigger']],
  59: [['automation'], ['apps-script', 'ai']],
  60: [['automation'], ['apps-script']],
  61: [['admin'], ['apps-script', 'ai']],
  62: [['admin'], ['apps-script']],
  63: [['automation'], ['apps-script', 'ai']],
  64: [['admin'], ['apps-script', 'ai']],
  65: [['survey'], ['apps-script', 'web-app', 'forms']],
  66: [['school', 'admin'], ['apps-script', 'docs']],
  67: [['schedule'], ['apps-script', 'calendar']],
  68: [['admin'], ['apps-script', 'gmail']],
  69: [['admin'], ['apps-script', 'gmail', 'docs']],
  70: [['admin'], ['apps-script', 'gmail', 'trigger']],
  71: [['survey'], ['apps-script', 'forms', 'ai']],
  72: [['sms-alert', 'survey'], ['apps-script', 'forms', 'external-api']],
  73: [['sms-alert'], ['apps-script', 'external-api', 'trigger']],
  74: [['admin'], ['apps-script', 'ai', 'docs']],
  75: [['admin', 'data'], ['apps-script', 'gmail', 'trigger']],
  76: [['data'], ['apps-script', 'external-api']],
  77: [['ai-tools'], ['ai']],
  78: [['automation'], ['apps-script', 'ai']],
  79: [['youtube'], ['apps-script']],
  80: [['youtube', 'ai-tools'], ['apps-script', 'ai']],
  81: [['youtube'], ['apps-script', 'external-api']],
  82: [['youtube'], ['apps-script', 'external-api']],
  83: [['youtube'], ['apps-script', 'external-api']],
  84: [['youtube'], ['apps-script', 'external-api']],
};

const vids = await sql`SELECT id, video_no FROM videos`;
const tagRows = await sql`SELECT id, slug FROM tags`;
const tagId = new Map(tagRows.map((t: any) => [t.slug, t.id]));
const vidId = new Map(vids.map((v: any) => [v.video_no, v.id]));

let inserted = 0, missing: string[] = [];
for (const [noStr, [tasks, techs]] of Object.entries(MAP)) {
  const no = Number(noStr);
  const vid = vidId.get(no);
  if (!vid) { missing.push(`#${no}(영상 없음)`); continue; }
  for (const slug of [...tasks, ...techs]) {
    const tid = tagId.get(slug);
    if (!tid) { missing.push(`#${no}:${slug}(태그 없음)`); continue; }
    const r = await sql`INSERT INTO video_tags (video_id, tag_id) VALUES (${vid}, ${tid}) ON CONFLICT DO NOTHING`;
    inserted += r.count;
  }
}
const [{ n }] = await sql`SELECT count(*)::int AS n FROM video_tags`;
console.log(`video_tags 시딩 완료 — 신규 ${inserted}, 총 ${n}행`);
if (missing.length) console.warn('⚠️ 누락:', missing.join(', '));
await sql.end();
