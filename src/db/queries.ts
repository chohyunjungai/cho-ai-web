// 페이지 데이터 조회 — 전부 읽기 전용. ISR 재생성 시에만 호출된다 (정적 우선, SPEC §5).
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db, t } from './app';

export type TemplateCard = {
  slug: string; title: string; type: string; previewPath: string | null;
  videoNo: number | null; requiresAuth: boolean;
};

const publishedTemplates = eq(t.templates.status, 'published');

/** 스토어 카드용 템플릿 목록 (+첫 연결 영상 번호), 태그 slug로 필터 가능 */
export async function getTemplates(tagSlug?: string): Promise<TemplateCard[]> {
  const rows = await db
    .select({
      slug: t.templates.slug,
      title: t.templates.title,
      type: t.templates.type,
      previewPath: t.templates.previewPath,
      requiresAuth: t.templates.requiresAuth,
      videoNo: sql<number | null>`(
        SELECT min(v.video_no) FROM video_templates vt JOIN videos v ON v.id = vt.video_id
        WHERE vt.template_slug = ${t.templates.slug})`,
      clicks: sql<number>`(
        SELECT count(*) FROM clicks_human c JOIN short_links s ON s.slug = c.link_slug
        JOIN video_templates vt ON vt.video_id = s.video_id
        WHERE vt.template_slug = ${t.templates.slug})`,
    })
    .from(t.templates)
    .where(tagSlug
      ? and(publishedTemplates, sql`EXISTS (
          SELECT 1 FROM template_tags tt JOIN tags tg ON tg.id = tt.tag_id
          WHERE tt.template_slug = ${t.templates.slug} AND tg.slug = ${tagSlug})`)
      : publishedTemplates)
    .orderBy(sql`7 DESC`, desc(t.templates.updatedAt)); // 7 = clicks 컬럼 서수 — 인기순 → 최신
  return rows;
}

export async function getTemplate(slug: string) {
  const [tpl] = await db.select().from(t.templates)
    .where(and(eq(t.templates.slug, slug), publishedTemplates));
  if (!tpl) return null;
  const videos = await db
    .select({ id: t.videos.id, videoNo: t.videos.videoNo, title: t.videos.title, thumbnailUrl: t.videos.thumbnailUrl })
    .from(t.videoTemplates)
    .innerJoin(t.videos, eq(t.videos.id, t.videoTemplates.videoId))
    .where(eq(t.videoTemplates.templateSlug, slug));
  const related = await db.execute(sql`
    SELECT DISTINCT tp.slug, tp.title, tp.type, tp.preview_path AS "previewPath",
           tp.requires_auth AS "requiresAuth", NULL::int AS "videoNo"
    FROM template_tags a
    JOIN template_tags b ON b.tag_id = a.tag_id AND b.template_slug <> a.template_slug
    JOIN templates tp ON tp.slug = b.template_slug AND tp.status = 'published'
    WHERE a.template_slug = ${slug} LIMIT 4`);
  return { ...tpl, videos, related: related.rows as unknown as TemplateCard[] };
}

/** 자료 연결이 있는 영상만 (갤러리 노출 규칙 SPEC §5-7) */
export async function getVideosWithMaterials() {
  return db
    .select({
      id: t.videos.id, videoNo: t.videos.videoNo, title: t.videos.title,
      thumbnailUrl: t.videos.thumbnailUrl, publishedAt: t.videos.publishedAt,
      materialCount: sql<number>`(SELECT count(*) FROM video_templates vt WHERE vt.video_id = ${t.videos.id})`,
    })
    .from(t.videos)
    .where(and(
      eq(t.videos.status, 'public'),
      sql`EXISTS (SELECT 1 FROM video_templates vt WHERE vt.video_id = ${t.videos.id})`,
    ))
    .orderBy(desc(t.videos.videoNo));
}

export async function getVideo(id: string) {
  const [video] = await db.select().from(t.videos).where(eq(t.videos.id, id));
  if (!video) return null;
  const templates = await db
    .select()
    .from(t.templates)
    .innerJoin(t.videoTemplates, eq(t.videoTemplates.templateSlug, t.templates.slug))
    .where(and(eq(t.videoTemplates.videoId, id), publishedTemplates))
    .then((rows) => rows.map((r) => r.templates));
  const bookCols = {
    isbn: t.books.isbn, title: t.books.title, subtitle: t.books.subtitle,
    author: t.books.author, publisher: t.books.publisher,
    coverUrl: t.books.coverUrl, note: t.books.note,
  };
  let books = await db
    .select(bookCols)
    .from(t.videoBooks)
    .innerJoin(t.books, eq(t.books.isbn, t.videoBooks.isbn))
    .where(eq(t.videoBooks.videoId, id));
  let promo = books.length === 0
    ? (await db.select().from(t.promos).where(eq(t.promos.active, true)).orderBy(t.promos.sort).limit(1))[0] ?? null
    : null;
  // 기본 프로모가 책이면 책 데이터로 통일해 렌더 (배너 한 가지 경로)
  if (promo?.isbn) {
    books = await db.select(bookCols).from(t.books).where(eq(t.books.isbn, promo.isbn));
    if (books.length) promo = null;
  }
  const browse = await db.execute(sql`
    SELECT DISTINCT tp.slug, tp.title, tp.type, tp.preview_path AS "previewPath",
           tp.requires_auth AS "requiresAuth", NULL::int AS "videoNo"
    FROM video_tags a
    JOIN template_tags b ON b.tag_id = a.tag_id
    JOIN templates tp ON tp.slug = b.template_slug AND tp.status = 'published'
    WHERE a.video_id = ${id}
      AND tp.slug NOT IN (SELECT template_slug FROM video_templates WHERE video_id = ${id})
    LIMIT 4`);
  return { video, templates, books, promo, browse: browse.rows as unknown as TemplateCard[] };
}

export async function getTaskTags() {
  return db
    .select({
      slug: t.tags.slug, name: t.tags.name,
      count: sql<number>`(
        SELECT count(*) FROM template_tags tt JOIN templates tp ON tp.slug = tt.template_slug
        WHERE tt.tag_id = ${t.tags.id} AND tp.status = 'published')`,
    })
    .from(t.tags)
    .where(eq(t.tags.category, 'task'))
    .orderBy(sql`2 DESC`)
    .then((r) => r.filter((x) => Number(x.count) > 0));
}

export async function getTag(slug: string) {
  const [tag] = await db.select().from(t.tags).where(eq(t.tags.slug, slug));
  return tag ?? null;
}

export async function getLatestVideos(limit = 6) {
  return db
    .select({ id: t.videos.id, videoNo: t.videos.videoNo, title: t.videos.title, thumbnailUrl: t.videos.thumbnailUrl })
    .from(t.videos)
    .where(and(eq(t.videos.status, 'public'),
      sql`EXISTS (SELECT 1 FROM video_templates vt WHERE vt.video_id = ${t.videos.id})`))
    .orderBy(desc(t.videos.publishedAt))
    .limit(limit);
}

/** 기본 프로모 책 — 홈 배너용 (promos 활성 1순위가 가리키는 책) */
export async function getDefaultBook() {
  const [promo] = await db.select().from(t.promos)
    .where(eq(t.promos.active, true)).orderBy(t.promos.sort).limit(1);
  if (!promo?.isbn) return null;
  const [book] = await db.select({
    isbn: t.books.isbn, title: t.books.title, subtitle: t.books.subtitle,
    author: t.books.author, publisher: t.books.publisher,
    coverUrl: t.books.coverUrl, note: t.books.note,
  }).from(t.books).where(eq(t.books.isbn, promo.isbn));
  return book ?? null;
}

/** 영상 번호로 직접 조회 — 검색창에 '18'·'18d'처럼 번호를 치면 상세로 직행시키는 용도 */
export async function getVideoByNo(no: number) {
  const [v] = await db.select({ id: t.videos.id }).from(t.videos).where(eq(t.videos.videoNo, no));
  return v ?? null;
}

/** 검색 — 템플릿·영상 제목 (pg_trgm 인덱스, 소규모라 ILIKE로 충분) */
export async function search(q: string) {
  const like = `%${q}%`;
  const templates = await db.select({
    slug: t.templates.slug, title: t.templates.title, type: t.templates.type,
    previewPath: t.templates.previewPath, requiresAuth: t.templates.requiresAuth,
    videoNo: sql<number | null>`NULL`,
  }).from(t.templates)
    .where(and(publishedTemplates, or(ilike(t.templates.title, like), ilike(t.templates.bodyMd, like))))
    .limit(30);
  const videos = await db.select({
    id: t.videos.id, videoNo: t.videos.videoNo, title: t.videos.title, thumbnailUrl: t.videos.thumbnailUrl,
  }).from(t.videos)
    .where(and(eq(t.videos.status, 'public'), ilike(t.videos.title, like),
      sql`EXISTS (SELECT 1 FROM video_templates vt WHERE vt.video_id = ${t.videos.id})`))
    .limit(30);
  return { templates: templates as TemplateCard[], videos };
}
