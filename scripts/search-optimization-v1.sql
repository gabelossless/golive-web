-- Optimization for Search Discovery at Scale (1M+ Users)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Adding GIN indexes for Full-Text Search on Title and Description

-- 1. Add searchable columns if using generated columns (best for performance)
-- Alternatively, we can just use a GIN index on the raw columns for ilike optimization

-- Title Index
CREATE INDEX IF NOT EXISTS idx_videos_title_trgm ON videos USING gin (title gin_trgm_ops);

-- Description Index
CREATE INDEX IF NOT EXISTS idx_videos_description_trgm ON videos USING gin (description gin_trgm_ops);

-- Category filtering optimization
CREATE INDEX IF NOT EXISTS idx_videos_category_desc ON videos USING btree (description) WHERE description LIKE '%Category:%';

-- Verification
-- EXPLAIN ANALYZE SELECT * FROM videos WHERE title ILIKE '%test%';
