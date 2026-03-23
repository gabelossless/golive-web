-- ============================================================
-- Zenith SQL Patch: Upload Limits & Streaming Foundation
-- Phase 46.5 — Stability & Prep
-- ============================================================

-- 1. Ensure profiles has role and subscription_tier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- 2. Migrate is_admin data to role column if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        UPDATE public.profiles SET role = 'admin' WHERE is_admin = true;
    END IF;
END $$;

-- 3. Add stream_key to profiles (encrypted/private)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream_key TEXT;

-- 4. Ensure videos has is_live and category (if not already ran setup-live-streaming.sql)
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS playback_id TEXT; -- For Livepeer HLS

-- 5. Create index for live status
CREATE INDEX IF NOT EXISTS idx_videos_is_live ON public.videos(is_live) WHERE is_live = true;

-- 6. Add trigger for updated_at on profile_settings (if missing)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profile_settings_modtime ON profile_settings;
CREATE TRIGGER update_profile_settings_modtime
    BEFORE UPDATE ON profile_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
