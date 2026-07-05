// DB 무결성 점검 — sync-verifier 에이전트·/db-check 커맨드가 사용하는 읽기 전용 검사
import { sql } from '../src/db/client';

const checks: [string, string, (r: any[]) => boolean][] = [
  ['videos 행 수', `SELECT count(*)::int AS n FROM videos`, (r) => r[0].n >= 70],
  ['tags 21개 (task 9 / tech 12)',
    `SELECT category, count(*)::int AS n FROM tags GROUP BY category ORDER BY category`,
    (r) => r.length === 2 && r[0].n === 9 && r[1].n === 12],
  ['video_no: 1부터 연속(결번 없음)',
    `SELECT min(video_no)::int AS lo, max(video_no)::int AS hi, count(*)::int AS n FROM videos`,
    (r) => r[0].lo === 1 && r[0].hi === r[0].n],
  ['video_no 순서 = 게시일 오름차순',
    `SELECT count(*)::int AS bad FROM (
       SELECT video_no, row_number() OVER (ORDER BY published_at, id)::int AS expected
       FROM videos) x WHERE video_no <> expected`,
    (r) => r[0].bad === 0],
  ['short_links = 영상 수 × 3',
    `SELECT (SELECT count(*)::int FROM short_links) AS links, (SELECT count(*)::int FROM videos) AS vids`,
    (r) => r[0].links === r[0].vids * 3],
  ['short_links 소문자·패턴 준수',
    `SELECT count(*)::int AS bad FROM short_links WHERE slug !~ '^[0-9]+[a-z]?$'`,
    (r) => r[0].bad === 0],
  ['고아 published 템플릿(영상 미연결)',
    `SELECT count(*)::int AS n FROM templates t WHERE t.status='published'
       AND NOT EXISTS (SELECT 1 FROM video_templates v WHERE v.template_slug=t.slug)`,
    (r) => r[0].n === 0],
  ['copy_url 전부 /copy로 끝남',
    `SELECT count(*)::int AS bad FROM templates WHERE copy_url NOT LIKE '%/copy'`,
    (r) => r[0].bad === 0],
  ['clicks_human 뷰 존재',
    `SELECT count(*)::int AS n FROM information_schema.views WHERE table_name='clicks_human'`,
    (r) => r[0].n === 1],
];

let fail = 0;
for (const [name, q, ok] of checks) {
  const rows = await sql.unsafe(q);
  const pass = ok(rows as any[]);
  if (!pass) fail++;
  console.log(`${pass ? '✅' : '❌'} ${name}${pass ? '' : ' — ' + JSON.stringify(rows)}`);
}
const shorts = await sql.unsafe(`SELECT count(*)::int AS n FROM videos WHERE is_short`);
console.log(`ℹ️ Shorts로 판별된 영상: ${(shorts as any)[0].n}개`);
console.log(fail ? `\n실패 ${fail}건` : '\n전체 통과');
await sql.end();
process.exit(fail ? 1 : 0);
