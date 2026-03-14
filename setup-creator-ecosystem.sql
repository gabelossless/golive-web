-- 1. Add advanced Creator Studio ecosystem toggles to the videos table
ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS allow_clipping boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_comments boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
    ADD COLUMN IF NOT EXISTS license text DEFAULT 'Standard';

-- Note: The `visibility` column was already added as 'text' in the previous schema fix
-- just ensuring the API gracefully handles 'Unlisted' going forward.

-- 2. Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
