// 템플릿 미리보기 자동 수확 — 링크 공유된 구글 파일의 드라이브 썸네일을 받아
// public/previews/{slug}.png 저장 + templates.preview_path 갱신. 재실행 안전.
// 실패한 파일은 CSS 자리표시가 유지되므로 fail-open.
import { mkdirSync, writeFileSync } from 'node:fs';
import { sql } from '../src/db/client';

mkdirSync('public/previews', { recursive: true });

const rows = await sql`SELECT slug, copy_url, type FROM templates WHERE status = 'published'`;
let ok = 0; const failed: string[] = [];

for (const r of rows as any[]) {
  const id = (r.copy_url.match(/\/d\/([-\w]{20,})/) ?? r.copy_url.match(/[?&]id=([-\w]{20,})/) ?? [])[1];
  if (!id) { failed.push(`${r.slug}(id 추출 실패)`); continue; }
  try {
    const res = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w1280`, { redirect: 'follow' });
    const buf = Buffer.from(await res.arrayBuffer());
    const isImage = res.ok && (res.headers.get('content-type') ?? '').startsWith('image') && buf.length > 5000;
    if (!isImage) { failed.push(`${r.slug}(썸네일 없음)`); continue; }
    writeFileSync(`public/previews/${r.slug}.png`, buf);
    await sql`UPDATE templates SET preview_path = ${'/previews/' + r.slug + '.png'}, updated_at = now() WHERE slug = ${r.slug}`;
    ok++;
    console.log(`✅ ${r.slug} (${Math.round(buf.length / 1024)}KB)`);
  } catch {
    failed.push(`${r.slug}(요청 실패)`);
  }
}
console.log(`\n완료: ${ok}/${(rows as any[]).length}`);
if (failed.length) console.log('⚠️ 실패 (CSS 자리표시 유지):', failed.join(', '));
await sql.end();
