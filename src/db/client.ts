import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL이 없습니다. .env.local 또는 환경변수를 확인하세요.');

export const sql = postgres(url, { max: 1, prepare: false });
export const db = drizzle(sql, { schema });
