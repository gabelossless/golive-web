-- Add is_short column for Shorts/Reels feature
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;

-- Index for fast Shorts queries
CREATE INDEX IF NOT EXISTS idx_videos_is_short ON public.videos(is_short) WHERE is_short = true;

-- Add video_url column if it doesn't exist (normalize from R2 public URL pattern)
-- The existing insert uses NEXT_PUBLIC_R2_PUBLIC_URL/path, so video_url should already exist
-- This is a safety check:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='videos' AND column_name='video_url') THEN
        ALTER TABLE public.videos ADD COLUMN video_url TEXT;
    END IF;
END $$;

COMMENT ON COLUMN public.videos.is_short IS 'True if this video is a vertical Short (9:16 aspect ratio or AI-generated clip)';
