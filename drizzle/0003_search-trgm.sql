-- 검색용 트라이그램 인덱스 — ILIKE '%q%'가 인덱스를 타게 (SPEC §1 검색: FTS + pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_videos_title_trgm ON videos USING gin (title gin_trgm_ops);
CREATE INDEX idx_templates_title_trgm ON templates USING gin (title gin_trgm_ops);
