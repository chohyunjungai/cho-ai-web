// 책 시딩 — 《유튜브 AI 비서 고용하기》 (2026-07-06). 재실행 안전(upsert).
// 배너 노출 규칙: video_books 연결 영상(#77~84)은 직접, 나머지 영상은 promos 기본값으로.
import { sql } from '../src/db/client';

const ISBN = '9791124516218';
const TITLE = '유튜브 AI 비서 고용하기';
const TAGLINE = '1시간 걸리던 채널 분석, 5초 만에 — 제미나이×노트북LM×구글시트';
const COVER = 'https://image.yes24.com/goods/189823964/xl';

await sql`
  INSERT INTO books (isbn, title, author, cover_url, note)
  VALUES (${ISBN}, ${TITLE}, '조현정', ${COVER}, ${TAGLINE})
  ON CONFLICT (isbn) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author,
    cover_url = EXCLUDED.cover_url, note = EXCLUDED.note`;

const LINKS: [string, string][] = [
  ['kyobo', 'https://product.kyobobook.co.kr/detail/S000220049009'],
  ['yes24', 'https://www.yes24.com/product/goods/189823964'],
  ['aladin', 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=393753455'],
];
for (const [store, url] of LINKS) {
  await sql`INSERT INTO book_links (isbn, store, url) VALUES (${ISBN}, ${store}, ${url})
    ON CONFLICT (isbn, store) DO UPDATE SET url = EXCLUDED.url`;
}

// 책 연계 시리즈 영상 (#유튜브AI비서고용하기 + 서점 라이브)
await sql`
  INSERT INTO video_books (video_id, isbn)
  SELECT id, ${ISBN} FROM videos WHERE video_no BETWEEN 77 AND 84
  ON CONFLICT DO NOTHING`;

// 나머지 모든 영상 페이지의 기본 프로모
await sql`
  INSERT INTO promos (kind, title, tagline, image_path, isbn, active, sort)
  SELECT 'book', ${TITLE}, ${TAGLINE}, ${COVER}, ${ISBN}, true, 0
  WHERE NOT EXISTS (SELECT 1 FROM promos WHERE isbn = ${ISBN})`;

const [{ vb }] = await sql`SELECT count(*)::int AS vb FROM video_books`;
console.log(`책 시딩 완료 — books 1, book_links 3, video_books ${vb}, promos(기본 배너) 1`);
await sql.end();
