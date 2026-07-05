import Link from 'next/link';
import Image from 'next/image';

type V = { id: string; videoNo: number; title: string; thumbnailUrl: string; publishedAt?: Date; materialCount?: number };

export function VideoCard({ v }: { v: V }) {
  return (
    <Link href={`/videos/${v.id}`} className="vcard">
      <div className="thumb">
        <Image src={v.thumbnailUrl} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" style={{ objectFit: 'cover' }} />
        {v.materialCount ? <span className="badge">📋 {v.materialCount}</span> : null}
      </div>
      <p className="tt">{v.title}</p>
      <p className="mt">
        #{v.videoNo}
        {v.publishedAt ? ` · ${new Date(v.publishedAt).toLocaleDateString('ko-KR')}` : ''}
      </p>
    </Link>
  );
}
