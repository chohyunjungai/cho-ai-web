// 짧은 링크 라우트 — cho-ai.com/123d 의 심장 (SPEC §3·§5, DESIGN 결정 ⑦)
// 규칙: 루트의 "숫자(+영문 소문자 1자)"는 영구 예약 · 302(캐시 방지) · ?via 부여 · fail-open.
// 발행된 링크는 영원히 리다이렉트된다 — active=false여도 이동은 계속.
import { NextRequest, NextResponse, after } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db, t } from '@/db/schema-route';
import { allowWrite, clientIp } from '@/rate-limit';

const SLUG_RE = /^\d+[a-z]?$/;

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const raw = (await ctx.params).code;
  const slug = raw.toLowerCase(); // 관대한 수신: /123D → /123d

  if (!SLUG_RE.test(slug)) {
    return new NextResponse(null, { status: 404 });
  }

  let target = '/'; // fail-open: 조회가 실패해도 리다이렉트는 무조건 수행 (최악 = 홈)
  try {
    const [link] = await db
      .select({ targetPath: t.shortLinks.targetPath })
      .from(t.shortLinks)
      .where(eq(t.shortLinks.slug, slug));
    if (!link) return new NextResponse(null, { status: 404 }); // 존재한 적 없는 번호만 404
    // 방어심층(보안감사 M-3): 같은 오리진 경로만 허용 — DB 오염 시 외부 오픈 리다이렉트 차단.
    const path = link.targetPath.startsWith('/') && !link.targetPath.startsWith('//')
      ? link.targetPath : '/';
    target = `${path}?via=${slug}`;
  } catch {
    // DB 다운 — 목적지를 모르므로 홈으로. 시청자의 이동 자체는 막지 않는다.
  }

  const res = NextResponse.redirect(new URL(target, req.nextUrl.origin), 302);

  // 클릭 기록 — 응답 이후 비동기, 실패해도 무시 (fail-open).
  // IP 레이트리밋 초과 시 기록만 스킵한다. 리다이렉트는 이미 위에서 반환됨(막지 않는다).
  const referrer = req.headers.get('referer');
  const userAgent = req.headers.get('user-agent');
  const ip = clientIp(req.headers);
  after(async () => {
    try {
      if (!(await allowWrite(ip))) return; // 스팸 캡 — 로그 폭주/비용 증폭 방지
      await db.execute(sql`
        INSERT INTO clicks (link_slug, referrer, user_agent)
        VALUES (${slug}, ${referrer}, ${userAgent})`);
    } catch { /* 로그 유실 허용 */ }
  });

  return res;
}
