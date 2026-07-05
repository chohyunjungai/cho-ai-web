// 짧은 링크 라우트 — cho-ai.com/123d 의 심장 (SPEC §3·§5, DESIGN 결정 ⑦)
// 규칙: 루트의 "숫자(+영문 소문자 1자)"는 영구 예약 · 302(캐시 방지) · ?via 부여 · fail-open.
// 발행된 링크는 영원히 리다이렉트된다 — active=false여도 이동은 계속.
import { NextRequest, NextResponse, after } from 'next/server';

// 라우트 핸들러는 React not-found 페이지를 렌더할 수 없으므로(빈 404가 됨)
// 슉슉이 ③ + 안내 문구를 담은 최소 HTML을 직접 반환한다 (DESIGN §5-2).
function notFoundPage(title: string, desc: string) {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — 조현정의AI실험실</title>
<style>
:root{color-scheme:light dark}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:"Noto Sans KR",system-ui,-apple-system,sans-serif;background:#fff;color:#0f0f0f;text-align:center}
@media(prefers-color-scheme:dark){body{background:#0f0f0f;color:#f1f1f1}
img{filter:drop-shadow(0 0 1px rgba(255,255,255,.35))}}
main{padding:48px 16px}img{height:96px;margin-bottom:12px}
h1{font-size:18px;margin:0 0 8px}p{font-size:14px;color:#606060;margin:0 0 16px}
@media(prefers-color-scheme:dark){p{color:#aaa}}
a{display:inline-block;margin:0 6px;padding:9px 16px;border-radius:20px;background:#f2f2f2;
color:#0f0f0f;text-decoration:none;font-size:14px;font-weight:500}
@media(prefers-color-scheme:dark){a{background:#272727;color:#f1f1f1}}
</style></head><body><main>
<img src="/shukshuk/3.webp" alt="">
<h1>${title}</h1><p>${desc}</p>
<a href="/">홈으로 가기</a><a href="/search">검색하기</a>
</main></body></html>`;
  return new NextResponse(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
import { eq, sql } from 'drizzle-orm';
import { db, t } from '@/db/schema-route';
import { allowWrite, clientIp } from '@/rate-limit';

const SLUG_RE = /^\d+[a-z]?$/;

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const raw = (await ctx.params).code;
  const slug = raw.toLowerCase(); // 관대한 수신: /123D → /123d

  if (!SLUG_RE.test(slug)) {
    return notFoundPage('이 주소의 페이지는 없어요', '주소가 바뀌었거나 잘못 입력된 것 같아요.');
  }

  let target = '/'; // fail-open: 조회가 실패해도 리다이렉트는 무조건 수행 (최악 = 홈)
  let missing = false; // 조회는 성공했지만 존재한 적 없는 번호
  try {
    const [link] = await db
      .select({ targetPath: t.shortLinks.targetPath })
      .from(t.shortLinks)
      .where(eq(t.shortLinks.slug, slug));
    if (!link) {
      missing = true;
    } else {
      // 방어심층(보안감사 M-3): 같은 오리진 경로만 허용 — DB 오염 시 외부 오픈 리다이렉트 차단.
      const path = link.targetPath.startsWith('/') && !link.targetPath.startsWith('//')
        ? link.targetPath : '/';
      target = `${path}?via=${slug}`;
    }
  } catch {
    // DB 다운 — 목적지를 모르므로 홈으로. 시청자의 이동 자체는 막지 않는다.
  }
  // 존재한 적 없는 번호만 404 — 발행된 링크는 영원히 리다이렉트 (CLAUDE.md 절대 규칙 2).
  if (missing) return notFoundPage('이 번호의 영상은 없어요', '주소의 번호를 다시 확인해 주세요.');

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
