// ⚠️ 재시딩용 일회성 도구 — videos와 연쇄 테이블(short_links·video_tags·video_templates·video_books·clicks)을 비운다.
// 짧은 링크가 유튜브에 발행된 이후에는 절대 실행 금지 (CLAUDE.md 규칙 1·2 — ID 영구 불변).
// 실수 방지: RESEED_CONFIRM=yes 환경변수 없이는 동작하지 않는다.
import { sql } from '../../src/db/client';

if (process.env.RESEED_CONFIRM !== 'yes') {
  console.error('RESEED_CONFIRM=yes 없이는 실행하지 않습니다. 링크 발행 후에는 이 스크립트를 쓰면 안 됩니다.');
  process.exit(1);
}
await sql`TRUNCATE videos CASCADE`;
console.log('videos + 연쇄 테이블 초기화 완료');
await sql.end();
