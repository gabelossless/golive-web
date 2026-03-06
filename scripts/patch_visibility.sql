-- Run this in your Supabase SQL Editor to add the visibility column
-- Required for Phase 41: Privacy Toggles

ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

-- If you have views, we can update old videos to be public automatically
UPDATE public.videos SET visibility = 'public' WHERE visibility IS NULL;
