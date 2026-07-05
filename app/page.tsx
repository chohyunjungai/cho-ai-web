// 홈 = 템플릿 스토어의 정문 (DESIGN §4) — 히어로 없음, 칩 아래 바로 매대
import Link from 'next/link';
import { getDefaultBook, getLatestVideos, getTaskTags, getTemplates } from '@/db/queries';
import { BookPromo } from '../components/BookPromo';
import { TemplateCard } from '../components/TemplateCard';
import { VideoCard } from '../components/VideoCard';

export const revalidate = 3600;

export default async function Home() {
  const [templates, tags, latest, book] = await Promise.all([
    getTemplates(), getTaskTags(), getLatestVideos(), getDefaultBook(),
  ]);
  const head = templates.slice(0, 6);
  const rest = templates.slice(6);
  return (
    <>
      <nav className="chips" aria-label="업무별 보기">
        <span className="chip on">전체</span>
        {tags.map((t) => (
          <Link key={t.slug} href={`/tags/${t.slug}`} className="chip">{t.name}</Link>
        ))}
      </nav>
      <div className="grid">
        {head.map((t) => <TemplateCard key={t.slug} t={t} />)}
      </div>
      {book && <BookPromo book={book} />}
      <section className="sect" aria-label="최신 영상">
        <h2>최신 영상</h2>
        <div className="vgrid">
          {latest.slice(0, 3).map((v) => <VideoCard key={v.id} v={v} />)}
        </div>
      </section>
      <div className="grid">
        {rest.map((t) => <TemplateCard key={t.slug} t={t} />)}
      </div>
      <div className="center">
        <Link href="/templates" className="btn">템플릿 전체 보기</Link>
      </div>
    </>
  );
}
