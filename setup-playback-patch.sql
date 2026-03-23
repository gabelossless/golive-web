-- Zenith Playback Patch v1 (Run in Supabase SQL Editor)
-- Fixes: column renames and schema alignment for premium video playback

-- 1. The 'transactions' table uses 'type' but we need it consistent.
--    This renames 'type' to 'transaction_type' to be explicit.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='transactions' AND column_name='type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='transactions' AND column_name='transaction_type'
    ) THEN
        ALTER TABLE transactions RENAME COLUMN "type" TO transaction_type;
    END IF;
END $$;

-- 2. Ensure status values use lowercase to be consistent
UPDATE transactions SET status = LOWER(status) WHERE status IS NOT NULL;

-- 3. Ensure playback_id column exists on videos for Livepeer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='videos' AND column_name='playback_id'
    ) THEN
        ALTER TABLE videos ADD COLUMN playback_id TEXT;
    END IF;
END $$;

-- 4. Ensure livepeer_stream_id column exists on videos 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='videos' AND column_name='livepeer_stream_id'
    ) THEN
        ALTER TABLE videos ADD COLUMN livepeer_stream_id TEXT;
    END IF;
END $$;

-- 5. Ensure is_live column exists on videos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='videos' AND column_name='is_live'
    ) THEN
        ALTER TABLE videos ADD COLUMN is_live BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 6. Make sure admin/premium users have is_premium = true
-- (Run this for your own admin user if needed)
-- UPDATE profiles SET is_premium = true WHERE role = 'admin';

-- 7. Videos RLS - Ensure all public videos are readable by anyone
-- (Check if a read policy for videos exists, create if not)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'videos' AND policyname = 'Public videos are viewable by everyone'
    ) THEN
        CREATE POLICY "Public videos are viewable by everyone" ON videos
            FOR SELECT USING (is_live = true OR visibility = 'public' OR visibility IS NULL);
    END IF;
END $$;

-- Done. Refresh your Supabase schema cache after running this.
SELECT 'Playback patch applied successfully' AS status;
