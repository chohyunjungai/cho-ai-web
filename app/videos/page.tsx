import type { Metadata } from 'next';
import Link from 'next/link';
import { getTaskTags, getVideosWithMaterials } from '@/db/queries';
import { VideoCard } from '../../components/VideoCard';

export const revalidate = 3600;
export const metadata: Metadata = { title: '영상' };

// 자료 연결이 있는 영상만 노출 (SPEC §5-7)
export default async function VideosPage() {
  const [videos, tags] = await Promise.all([getVideosWithMaterials(), getTaskTags()]);
  return (
    <>
      <nav className="chips" aria-label="업무별 보기">
        <span className="chip on">전체</span>
        {tags.map((t) => (
          <Link key={t.slug} href={`/tags/${t.slug}`} className="chip">{t.name}</Link>
        ))}
      </nav>
      <div className="vgrid">
        {videos.map((v) => <VideoCard key={v.id} v={v} />)}
      </div>
    </>
  );
}
