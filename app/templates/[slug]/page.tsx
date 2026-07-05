// 템플릿 상세 — 상품 상세, 전환이 일어나는 곳 (DESIGN §4)
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, t } from '@/db/app';
import { eq } from 'drizzle-orm';
import { getTemplate } from '@/db/queries';
import { CopyButton } from '../../../components/CopyButton';
import { Preview, TemplateCard } from '../../../components/TemplateCard';
import { VideoCard } from '../../../components/VideoCard';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await db.select({ slug: t.templates.slug }).from(t.templates)
    .where(eq(t.templates.status, 'published'));
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tpl = await getTemplate((await params).slug);
  return { title: tpl?.title ?? '템플릿' };
}

const TYPE_LABEL: Record<string, string> = { sheet: '구글시트', doc: '구글문서', form: '구글설문지', file: '다운로드 파일' };

export default async function TemplateDetail({ params }: { params: Promise<{ slug: string }> }) {
  const tpl = await getTemplate((await params).slug);
  if (!tpl) notFound();
  return (
    <>
      <div className="cols" style={{ paddingTop: 12 }}>
        <div className="colmain">
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <Preview type={tpl.type} previewPath={tpl.previewPath} title={tpl.title} />
          </div>
        </div>
        <div className="colrail" style={{ padding: '12px 16px' }}>
          <h1 style={{ fontSize: 18, lineHeight: '24px', fontWeight: 700 }}>{tpl.title}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 12px' }}>
            {TYPE_LABEL[tpl.type] ?? tpl.type}
            {tpl.requiresAuth && ' · ⚡ 자동화 스크립트 포함'}
            {tpl.version && ` · v${tpl.version}`}
          </p>
          <CopyButton copyUrl={tpl.copyUrl} requiresAuth={tpl.requiresAuth} title={tpl.title} />
          {tpl.githubPath && (
            <p style={{ marginTop: 12 }}>
              <a className="btn" href={`https://github.com/chohyunjungai/${tpl.githubPath}`} target="_blank" rel="noopener">
                코드 보기 (GitHub)
              </a>
            </p>
          )}
        </div>
      </div>

      {tpl.bodyMd && (
        <section className="prose">
          {tpl.bodyMd.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </section>
      )}

      {tpl.videos.length > 0 && (
        <section className="sect" aria-label="소개 영상">
          <h2>소개 영상</h2>
          <div className="vgrid">
            {tpl.videos.map((v) => <VideoCard key={v.id} v={v} />)}
          </div>
        </section>
      )}

      {tpl.related.length > 0 && (
        <section className="sect" aria-label="비슷한 자료">
          <h2>비슷한 자료</h2>
          <div className="grid" style={{ paddingLeft: 0, paddingRight: 0 }}>
            {tpl.related.map((r) => <TemplateCard key={r.slug} t={r} />)}
          </div>
        </section>
      )}
      <div className="center">
        <Link href="/templates" className="btn">템플릿 전체 보기</Link>
      </div>
    </>
  );
}
