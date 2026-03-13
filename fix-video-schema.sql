-- 1. Ensure the 'videos' table has all required modern columns
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS duration text DEFAULT '0:00',
ADD COLUMN IF NOT EXISTS width integer DEFAULT 1920,
ADD COLUMN IF NOT EXISTS height integer DEFAULT 1080,
ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'Public';

-- 2. Force PostgREST (the API layer of Supabase) to reload its schema cache.
-- This is critical! If you add columns but don't reload the cache, the API 
-- will throw a "could not find the schema/column in cache" error.
NOTIFY pgrst, 'reload schema';
