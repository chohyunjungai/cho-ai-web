import Link from 'next/link';
import type { TemplateCard as T } from '@/db/queries';

const TYPE_LABEL: Record<string, string> = { sheet: '시트', doc: '문서', form: '설문지', file: '파일' };

export function Preview({ type, previewPath, title }: { type: string; previewPath: string | null; title?: string }) {
  return (
    <div className={`pv ${type !== 'sheet' ? type : ''}`} aria-hidden>
      {previewPath && <img src={previewPath} alt={title ?? ''} loading="lazy" />}
    </div>
  );
}

/** 스토어 상품 카드 — 카드 안에 버튼 없음, 탭 → 상세 (DESIGN §3-2) */
export function TemplateCard({ t }: { t: T }) {
  return (
    <Link href={`/templates/${t.slug}`} className="prod">
      <span className="type-badge">{TYPE_LABEL[t.type] ?? t.type}</span>
      <Preview type={t.type} previewPath={t.previewPath} title={t.title} />
      <div className="bd">
        <p className="tt">{t.title}</p>
        {t.videoNo != null && <p className="mt">#{t.videoNo}</p>}
      </div>
    </Link>
  );
}
