// 서점 경유 — outbound_clicks 기록 후 302 (SPEC §5-6, fail-open 동일)
import { NextRequest, NextResponse, after } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { db, t } from '@/db/schema-route';

const STORES = new Set(['kyobo', 'yes24', 'aladin', 'other']);

export async function GET(req: NextRequest, ctx: { params: Promise<{ store: string; isbn: string }> }) {
  const { store, isbn } = await ctx.params;
  if (!STORES.has(store)) return new NextResponse(null, { status: 404 });

  let url: string | null = null;
  try {
    const [row] = await db
      .select({ url: t.bookLinks.url })
      .from(t.bookLinks)
      .where(and(eq(t.bookLinks.isbn, isbn), eq(t.bookLinks.store, store)));
    url = row?.url ?? null;
  } catch { /* fail-open */ }
  if (!url) return NextResponse.redirect(new URL('/', req.nextUrl.origin), 302);

  // ?v= 는 유튜브 videoId 형식만 통과 — 위조 값 저장/FK 위반 유실 방지 (보안감사 L-2)
  const rawV = req.nextUrl.searchParams.get('v');
  const videoId = rawV && /^[\w-]{11}$/.test(rawV) ? rawV : null;
  const userAgent = req.headers.get('user-agent');
  after(async () => {
    try {
      await db.execute(sql`
        INSERT INTO outbound_clicks (isbn, store, video_id, user_agent)
        VALUES (${isbn}, ${store}, ${videoId}, ${userAgent})`);
    } catch { /* 로그 유실 허용 */ }
  });

  return NextResponse.redirect(url, 302);
}
