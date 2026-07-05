// 핵심 테이블 → JSON 파일 내보내기 (야간 스냅샷의 LLM/파일 친화 사본, cho-ai-data에 커밋됨)
// 사용: tsx scripts/export-json.ts <출력디렉터리>
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../src/db/client';

const outDir = process.argv[2] ?? './data';
mkdirSync(outDir, { recursive: true });

const TABLES = [
  'videos', 'templates', 'template_versions', 'video_templates',
  'tags', 'video_tags', 'template_tags', 'short_links',
  'books', 'book_links', 'video_books', 'promos',
  'clicks', 'outbound_clicks',
];

for (const t of TABLES) {
  const rows = await sql.unsafe(`SELECT * FROM ${t}`);
  writeFileSync(join(outDir, `${t}.json`), JSON.stringify(rows, null, 1));
  console.log(`${t}: ${rows.length}행`);
}
await sql.end();
