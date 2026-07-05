// IP별 레이트리밋 (보안감사 M-2) — Vercel + Upstash Redis.
// 원칙: 리다이렉트 자체는 절대 막지 않는다(CLAUDE.md 규칙 2). 비용/오염의 원인인
// 클릭 기록(INSERT)·검색 쿼리만 제한한다. 리미터 env가 없거나 에러면 항상 허용(fail-open, 규칙 9).
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

function make(tokens: number, window: `${number} s`) {
  return redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), analytics: false, prefix: 'choai' })
    : null;
}

// 클릭 기록: IP당 10초 20건. 정상 시청자는 절대 안 걸리고, 스크립트 스팸만 캡.
const writeLimiter = make(20, '10 s');
// 검색: IP당 10초 15건 — 동적 ILIKE 2쿼리가 도는 유일한 라우트.
const searchLimiter = make(15, '10 s');

/** true면 허용. 리미터 부재/에러는 fail-open으로 허용. */
async function allow(limiter: Ratelimit | null, key: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch {
    return true; // Redis 장애가 기능을 막지 않는다
  }
}

/** 프록시 뒤 클라이언트 IP (Vercel: x-forwarded-for). 없으면 'anon' 버킷. */
export function clientIp(h: Headers): string {
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'anon';
}

export const allowWrite = (ip: string) => allow(writeLimiter, `w:${ip}`);
export const allowSearch = (ip: string) => allow(searchLimiter, `s:${ip}`);
