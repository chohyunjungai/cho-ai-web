import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getVideoByNo, search } from '@/db/queries';
import { TemplateCard } from '../../components/TemplateCard';
import { VideoCard } from '../../components/VideoCard';

export const metadata: Metadata = { title: '검색' };
export const dynamic = 'force-dynamic'; // 검색만 동적 — 나머지 페이지는 전부 정적

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  // 영상 번호 직행: '18', '18d', '18c' 등 짧은 링크 패턴이면 검색 없이 상세로
  const noMatch = q?.trim().toLowerCase().match(/^(\d{1,6})[a-z]?$/);
  if (noMatch) {
    const v = await getVideoByNo(Number(noMatch[1]));
    if (v) redirect(`/videos/${v.id}`);
  }

  const result = q?.trim() ? await search(q.trim()) : null;
  return (
    <>
      <form className="searchbox" action="/search" role="search">
        <input name="q" defaultValue={q ?? ''} placeholder="어떤 반복 작업을 자동화할까요?" autoFocus aria-label="검색어" />
        <button className="btn" type="submit">검색</button>
      </form>
      {result && (
        <>
          {result.templates.length > 0 && (
            <section className="sect"><h2>템플릿</h2>
              <div className="grid" style={{ paddingLeft: 0, paddingRight: 0 }}>
                {result.templates.map((x) => <TemplateCard key={x.slug} t={x} />)}
              </div>
            </section>
          )}
          {result.videos.length > 0 && (
            <section className="sect"><h2>영상</h2>
              <div className="vgrid">
                {result.videos.map((v) => <VideoCard key={v.id} v={v} />)}
              </div>
            </section>
          )}
          {result.templates.length === 0 && result.videos.length === 0 && (
            <div className="empty">
              <p style={{ fontWeight: 700, marginBottom: 6 }}>음… &lsquo;{q}&rsquo;는 못 찾았어요</p>
              <p>다른 단어로 검색해 보시거나, 홈의 분류 칩에서 골라보세요.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
