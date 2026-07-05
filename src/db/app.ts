// 앱 런타임(페이지·라우트 핸들러)용 DB 클라이언트 — Neon serverless HTTP 드라이버.
// 커넥션 풀 부담이 없고 서버리스에 적합 (SPEC §5-4). 스크립트는 postgres-js(client.ts) 사용.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL 환경변수가 없습니다.');

export const db = drizzle(neon(url), { schema });
export * as t from './schema';
