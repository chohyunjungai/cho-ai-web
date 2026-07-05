// 영상 상세 — 짧은 링크 도착 지점 (DESIGN §4): 컨텍스트 라인 → 프로모 → 템플릿(사본) → 둘러보기. 임베드 없음.
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, t } from '@/db/app';
import { getVideo } from '@/db/queries';
import { BookPromo, type Book as BookType } from '../../../components/BookPromo';
import { ContextLabel } from '../../../components/ContextLabel';
import { CopyButton } from '../../../components/CopyButton';
import { Shuk } from '../../../components/Shuk';
import { Preview, TemplateCard } from '../../../components/TemplateCard';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await db.select({ id: t.videos.id }).from(t.videos);
  return rows.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await getVideo((await params).id);
  return { title: data ? `#${data.video.videoNo} ${data.video.title}` : '영상' };
}

export default async function VideoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getVideo(id);
  if (!data) notFound();
  const { video, templates, books, promo, browse } = data;
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <div className="cols">
      <div className="colmain">
        <a href={youtubeUrl} target="_blank" rel="noopener" className="ctx">
          <span className="mini">
            <Image src={video.thumbnailUrl} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
          </span>
          <span>
            <ContextLabel />
            <span className="ti">{video.title}</span>
          </span>
        </a>

        <div className="only-mobile">
          <PromoBlock books={books} promo={promo} videoId={video.id} />
        </div>

        {templates.length > 0 ? (
          templates.map((tpl) => (
            <div key={tpl.slug} className="trow">
              <Link href={`/templates/${tpl.slug}`} className="row">
                <Preview type={tpl.type} previewPath={tpl.previewPath} />
                <div>
                  <p className="tt">{tpl.title}</p>
                  {tpl.requiresAuth && <p className="auth">⚡ 자동화 스크립트 포함</p>}
                </div>
              </Link>
              <CopyButton copyUrl={tpl.copyUrl} requiresAuth={tpl.requiresAuth} title={tpl.title} />
            </div>
          ))
        ) : (
          <div className="empty">
            <Shuk pose={7} size={96} />
            <p>이 영상은 보는 것만으로 완성! 대신 이런 자료는 어때요?</p>
          </div>
        )}
      </div>

      <div className="colrail">
        <div className="only-desktop">
          <PromoBlock books={books} promo={promo} videoId={video.id} />
        </div>
        {browse.length > 0 && (
          <section className="sect" aria-label="다른 자료 둘러보기">
            <h2>다른 자료 둘러보기</h2>
            <div className="grid" style={{ padding: '0 0 8px', gridTemplateColumns: '1fr 1fr' }}>
              {browse.map((b) => <TemplateCard key={b.slug} t={b} />)}
            </div>
          </section>
        )}
        <div className="center">
          <Link href="/templates" className="btn">템플릿 전체 보기</Link>
        </div>
      </div>
    </div>
  );
}

function PromoBlock({ books, promo, videoId }: {
  books: BookType[];
  promo: { kind: string; title: string; tagline: string | null; imagePath: string | null; targetUrl: string | null } | null;
  videoId: string;
}) {
  const book = books[0];
  if (book) return <BookPromo book={book} videoId={videoId} />;
  if (promo) {
    return (
      <div className="promo">
        <div className="cover">{promo.imagePath ? <img src={promo.imagePath} alt={promo.title} /> : promo.title}</div>
        <div>
          <p className="b-title">{promo.title}</p>
          {promo.tagline && <p className="b-copy">{promo.tagline}</p>}
          {promo.targetUrl && (
            <div className="pstores">
              <a className="pstore" href={promo.targetUrl} target="_blank" rel="noopener">
                {promo.kind === 'lecture' ? '강의 보기' : '자세히 보기'}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
