-- setup-admin-infra.sql

-- 1. DEFINE ADMINS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Promote specified emails to Admin
-- Note: This requires the users to exist in auth.users first.
-- For the showcase, we target the profiles linked to these emails.
UPDATE public.profiles
SET is_admin = true
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('gabelossless@gmail.com', 'thecarterzachery@gmail.com', 'roadadventureone@gmail.com')
);

-- 2. INFRASTRUCTURE OPTIMIZATION: INDEXES
-- Speed up the "Vibe-Rank" and "Discovery" queries
CREATE INDEX IF NOT EXISTS idx_videos_quality_score ON public.videos (quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category_views ON public.videos (category, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_velocity ON public.videos (created_at DESC, view_count DESC);

-- 3. INFRASTRUCTURE OPTIMIZATION: STORAGE CACHING
-- (Conceptual: In Supabase, Cache-Control is often set during upload or via Storage API)
-- We will ensure the upload code sets 'public, max-age=31536000' for videos and thumbnails.

-- 4. GROWTH MOMENTUM: ADVANCED BOT STATS
-- Adding refined target columns for more granular control if needed
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS engagement_rate_target FLOAT DEFAULT 0.05; -- 5% target engagement
