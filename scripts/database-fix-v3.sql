-- COMPREHENSIVE DATABASE FIX V3
-- This script adds missing columns and tags test data for Shorts/Playback recovery

-- 1. Add missing videos columns
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS hype_count INTEGER DEFAULT 0;

-- 2. Add missing profile columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 3. Create index for Shorts
CREATE INDEX IF NOT EXISTS idx_videos_is_short ON public.videos(is_short) WHERE is_short = true;

-- 3. Ensure subscriptions table exists (safety check)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(subscriber_id, channel_id)
);

-- 4. Tag a test video as a Short for verification
-- This grabs the most recent video and makes it a Short
DO $$
BEGIN
    UPDATE public.videos
    SET is_short = true
    WHERE id = (SELECT id FROM public.videos ORDER BY created_at DESC LIMIT 1);
END $$;

-- 5. RPC for Hype (Phase 10)
CREATE OR REPLACE FUNCTION increment_hype_count(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.videos
    SET hype_count = COALESCE(hype_count, 0) + 1
    WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN public.videos.is_short IS 'True if vertical 9:16 video';
COMMENT ON COLUMN public.videos.quality_score IS 'AI-generated score 0-100';
