// 라우트 핸들러용 지연 초기화 클라이언트 — 요청마다 fetch 기반 (커넥션 유지 없음)
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function makeDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('no DATABASE_URL');
  return drizzle(neon(url), { schema });
}

// DATABASE_URL이 없어도 모듈 로드는 성공해야 한다 (fail-open — 라우트의 try가 처리)
let cached: ReturnType<typeof makeDb> | null = null;
export const db = new Proxy({} as ReturnType<typeof makeDb>, {
  get(_, prop) {
    cached ??= makeDb();
    return (cached as any)[prop];
  },
});
export * as t from './schema';
