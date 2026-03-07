-- setup-scaling.sql

-- 1. EXPAND PROFILES FOR PERSONALIZATION
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'creator'; -- 'creator', 'partner', 'pro'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT false;

-- 2. DISCOVERY ENGINE: VELOCITY TRACKING
CREATE TABLE IF NOT EXISTS public.video_growth_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    views_at_snapshot BIGINT NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for velocity calculations
CREATE INDEX IF NOT EXISTS idx_growth_video_time ON public.video_growth_snapshots(video_id, captured_at DESC);

-- 3. ENSURE SETTINGS STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Banners Bucket Policies
DROP POLICY IF EXISTS "Banners are publicly accessible." ON storage.objects;
CREATE POLICY "Banners are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'banners' );

DROP POLICY IF EXISTS "Users can upload banners." ON storage.objects;
CREATE POLICY "Users can upload banners."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update own banners." ON storage.objects;
CREATE POLICY "Users can update own banners."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'banners' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'banners' AND auth.uid() = owner );
