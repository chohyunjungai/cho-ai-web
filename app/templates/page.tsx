import type { Metadata } from 'next';
import Link from 'next/link';
import { getTaskTags, getTemplates } from '@/db/queries';
import { TemplateCard } from '../../components/TemplateCard';

export const revalidate = 3600;
export const metadata: Metadata = { title: '템플릿' };

export default async function TemplatesPage() {
  const [templates, tags] = await Promise.all([getTemplates(), getTaskTags()]);
  return (
    <>
      <nav className="chips" aria-label="업무별 보기">
        <span className="chip on">전체</span>
        {tags.map((t) => (
          <Link key={t.slug} href={`/tags/${t.slug}`} className="chip">{t.name}</Link>
        ))}
      </nav>
      <p style={{ padding: '4px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>템플릿 {templates.length}개 · 인기순</p>
      <div className="grid">
        {templates.map((t) => <TemplateCard key={t.slug} t={t} />)}
      </div>
    </>
  );
}
