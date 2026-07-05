// cho-ai.com DB 스키마 — SPEC.md §2가 원본 명세. 여기와 SPEC이 어긋나면 SPEC을 따른다.
// 불변 원칙: videos.id / video_no / templates.slug / short_links.slug / books.isbn은 영원히 유지, 재사용 금지.
import { sql } from 'drizzle-orm';
import {
  pgTable, text, integer, boolean, serial, bigserial, timestamp,
  primaryKey, foreignKey, index, check,
} from 'drizzle-orm/pg-core';

// ========== 콘텐츠 코어 ==========

// videos는 기계 전용 — 동기화 크론만 쓴다. 사람·에이전트 직접 수정 금지.
export const videos = pgTable('videos', {
  id: text('id').primaryKey(),                       // YouTube videoId (불변)
  videoNo: integer('video_no').unique().notNull(),   // 짧은 링크용 연번 (불변, 재사용 금지)
  title: text('title').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  description: text('description'),
  status: text('status').notNull().default('public'),
  isShort: boolean('is_short').notNull().default(false),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
}, (t) => [
  check('videos_status_check', sql`${t.status} IN ('public','unlisted','private','deleted')`),
]);

export const templates = pgTable('templates', {
  slug: text('slug').primaryKey(),                   // 불변 ID (kebab-case)
  title: text('title').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  copyUrl: text('copy_url').notNull(),               // 구글 "사본 만들기" 링크 (/copy)
  githubPath: text('github_path'),
  version: text('version'),
  requiresAuth: boolean('requires_auth').notNull().default(false),
  previewPath: text('preview_path'),                 // 스토어 카드 미리보기 (/public/previews/{slug}.png)
  bodyMd: text('body_md'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('templates_type_check', sql`${t.type} IN ('sheet','doc','form','file')`),  // 2026-07-05 실데이터: 폼·파일 자료 존재
  check('templates_status_check', sql`${t.status} IN ('draft','published','deprecated')`),
]);

export const templateVersions = pgTable('template_versions', {
  id: serial('id').primaryKey(),
  templateSlug: text('template_slug').notNull().references(() => templates.slug),
  version: text('version').notNull(),
  note: text('note'),
  releasedAt: timestamp('released_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== 관계 (N:M은 전부 연결 테이블) ==========

export const videoTemplates = pgTable('video_templates', {
  videoId: text('video_id').notNull().references(() => videos.id),
  templateSlug: text('template_slug').notNull().references(() => templates.slug),
}, (t) => [primaryKey({ columns: [t.videoId, t.templateSlug] })]);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),                      // 한국어 표시명
  slug: text('slug').unique().notNull(),
  category: text('category').notNull(),
}, (t) => [
  check('tags_category_check', sql`${t.category} IN ('task','tech')`),
]);

export const videoTags = pgTable('video_tags', {
  videoId: text('video_id').notNull().references(() => videos.id),
  tagId: integer('tag_id').notNull().references(() => tags.id),
}, (t) => [primaryKey({ columns: [t.videoId, t.tagId] })]);

export const templateTags = pgTable('template_tags', {
  templateSlug: text('template_slug').notNull().references(() => templates.slug),
  tagId: integer('tag_id').notNull().references(() => tags.id),
}, (t) => [primaryKey({ columns: [t.templateSlug, t.tagId] })]);

// ========== 짧은 링크 · 클릭 ==========

// 발행된 짧은 링크는 영원히 리다이렉트된다. 행 삭제 금지. active=false는 표지일 뿐.
export const shortLinks = pgTable('short_links', {
  slug: text('slug').primaryKey(),                   // '123', '123d', '123c' (소문자)
  videoId: text('video_id').notNull().references(() => videos.id),
  position: text('position').notNull(),
  targetPath: text('target_path').notNull(),
  active: boolean('active').notNull().default(true),
}, (t) => [
  check('short_links_position_check', sql`${t.position} IN ('description','comment','other')`),
]);

export const clicks = pgTable('clicks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  linkSlug: text('link_slug').notNull().references(() => shortLinks.slug),
  clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull().defaultNow(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),                     // 원문 저장 — 봇 판별은 조회 시(clicks_human 뷰)
}, (t) => [
  index('idx_clicks_slug_at').on(t.linkSlug, t.clickedAt),
  index('idx_clicks_at').on(t.clickedAt),
]);

// ========== 책 · 프로모 ==========

export const books = pgTable('books', {
  isbn: text('isbn').primaryKey(),                   // ISBN-13 (불변)
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  author: text('author'),
  publisher: text('publisher'),
  coverUrl: text('cover_url'),
  note: text('note'),                                // 배너 카피 한 줄
});

export const bookLinks = pgTable('book_links', {
  isbn: text('isbn').notNull().references(() => books.isbn),
  store: text('store').notNull(),
  url: text('url').notNull(),
}, (t) => [
  primaryKey({ columns: [t.isbn, t.store] }),
  check('book_links_store_check', sql`${t.store} IN ('kyobo','yes24','aladin','other')`),
]);

export const videoBooks = pgTable('video_books', {
  videoId: text('video_id').notNull().references(() => videos.id),
  isbn: text('isbn').notNull().references(() => books.isbn),
}, (t) => [primaryKey({ columns: [t.videoId, t.isbn] })]);

export const outboundClicks = pgTable('outbound_clicks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  isbn: text('isbn').notNull(),
  store: text('store').notNull(),
  videoId: text('video_id').references(() => videos.id),
  clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull().defaultNow(),
  userAgent: text('user_agent'),
}, (t) => [
  foreignKey({ columns: [t.isbn, t.store], foreignColumns: [bookLinks.isbn, bookLinks.store], name: 'outbound_clicks_book_link_fk' }),
  index('idx_outbound_video_at').on(t.videoId, t.clickedAt),
]);

// 영상 상세 상단 프로모 배너 — video_books 연결이 없을 때의 기본값
export const promos = pgTable('promos', {
  id: serial('id').primaryKey(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  tagline: text('tagline'),
  imagePath: text('image_path'),
  targetUrl: text('target_url'),                     // 강의 등 외부 링크 (책이면 NULL)
  isbn: text('isbn').references(() => books.isbn),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0),
}, (t) => [
  check('promos_kind_check', sql`${t.kind} IN ('book','lecture','other')`),
]);
