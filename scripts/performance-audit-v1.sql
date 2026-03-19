-- Performance Audit: Ensuring Indexes for Scale (100k-1M Users)

-- 1. Index for checking subscriptions (subscriber_id)
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);

-- 2. Index for fetching latest videos from followed channels (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_videos_user_id_created_at ON videos(user_id, created_at DESC);

-- 3. Index for fetching liked videos (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_likes_user_id_created_at ON likes(user_id, created_at DESC);

-- 4. Index for video search (ilike title/description - usually needs trigram or full-text, but ilike benefits from custom indexes)
-- Using GIN index for fuzzy search if pg_trgm is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_videos_title_trgm ON videos USING gin (title gin_trgm_ops);

-- 5. Index for trending videos (view_count)
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos(view_count DESC);

-- 6. Index for shorts check
CREATE INDEX IF NOT EXISTS idx_videos_is_short ON videos(is_short) WHERE is_short = true;

-- 7. Ensure profiles has index on username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
