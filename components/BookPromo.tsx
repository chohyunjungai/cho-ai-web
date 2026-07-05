// 책 프로모 배너 — 서점 스타일 (DESIGN §3-2b). 홈·영상 상세 공용.
// videoId가 있으면 /out/ 클릭에 출처 영상이 기록되고, 없으면(홈) video_id NULL로 기록된다.
export type Book = {
  isbn: string; title: string; subtitle: string | null; author: string | null;
  publisher: string | null; coverUrl: string | null; note: string | null;
};

const STORES = [
  ['kyobo', '교보문고'],
  ['yes24', '예스24'],
  ['aladin', '알라딘'],
] as const;

export function BookPromo({ book, videoId }: { book: Book; videoId?: string }) {
  return (
    <div className="promo">
      <div className="cover">
        {book.coverUrl ? <img src={book.coverUrl} alt={`${book.title} 표지`} /> : book.title}
      </div>
      <div>
        <p className="b-title">{book.title}</p>
        {book.subtitle && <p className="b-sub">{book.subtitle}</p>}
        {book.note && <p className="b-copy">{book.note}</p>}
        <p className="b-author">{[book.author && `${book.author} 저`, book.publisher].filter(Boolean).join(' | ')}</p>
        <div className="pstores">
          {STORES.map(([slug, label]) => (
            <a key={slug} className="pstore" target="_blank" rel="noopener"
               href={`/out/${slug}/${book.isbn}${videoId ? `?v=${videoId}` : ''}`}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
