// 태그 통합 뷰 — 해당 태그의 템플릿 + 영상 한 페이지 (SPEC §3)
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, t } from '@/db/app';
import { getTag, getTaskTags, getTemplates } from '@/db/queries';
import { sql } from 'drizzle-orm';
import { TemplateCard } from '../../../components/TemplateCard';
import { VideoCard } from '../../../components/VideoCard';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await db.select({ slug: t.tags.slug }).from(t.tags);
  return rows.map((r) => ({ tag: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const tag = await getTag((await params).tag);
  return { title: tag?.name ?? '태그' };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: slug } = await params;
  const tag = await getTag(slug);
  if (!tag) notFound();
  const [templates, tags, videos] = await Promise.all([
    getTemplates(slug),
    getTaskTags(),
    db.select({ id: t.videos.id, videoNo: t.videos.videoNo, title: t.videos.title, thumbnailUrl: t.videos.thumbnailUrl })
      .from(t.videos)
      .where(sql`${t.videos.status} = 'public'
        AND EXISTS (SELECT 1 FROM video_tags vt JOIN tags tg ON tg.id = vt.tag_id
                    WHERE vt.video_id = ${t.videos.id} AND tg.slug = ${slug})
        AND EXISTS (SELECT 1 FROM video_templates m WHERE m.video_id = ${t.videos.id})`),
  ]);
  return (
    <>
      <nav className="chips" aria-label="업무별 보기">
        <Link href="/" className="chip">전체</Link>
        {tags.map((x) => (
          <Link key={x.slug} href={`/tags/${x.slug}`} className={`chip${x.slug === slug ? ' on' : ''}`}>{x.name}</Link>
        ))}
      </nav>
      {templates.length > 0 && (
        <div className="grid">
          {templates.map((x) => <TemplateCard key={x.slug} t={x} />)}
        </div>
      )}
      {videos.length > 0 && (
        <section className="sect" aria-label="관련 영상">
          <h2>영상</h2>
          <div className="vgrid">
            {videos.map((v) => <VideoCard key={v.id} v={v} />)}
          </div>
        </section>
      )}
      {templates.length === 0 && videos.length === 0 && (
        <div className="empty"><p>아직 이 분류의 자료가 없어요 — 준비 중입니다!</p></div>
      )}
    </>
  );
}
