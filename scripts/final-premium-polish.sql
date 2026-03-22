-- Final Premium Polish: Database Schema & Dicebear Purge
-- Run this in the Supabase SQL Editor to complete the branding transition.

-- 1. Ensure Profile Schema is Complete
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS channel_color TEXT DEFAULT '#FFB800';

-- 2. Purge Dicebear from Auto-generated Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 1;
BEGIN
  -- Try to get username from metadata, or fallback to email prefix
  base_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  
  -- Ensure minimum length of 3
  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := base_username || 'user' || floor(random() * 1000)::text;
  END IF;
  
  -- Basic alphanumeric normalization
  base_username := regexp_replace(base_username, '\W+', '', 'g');
  
  final_username := base_username;
  
  -- Handle potential uniqueness collisions
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || counter::text;
    counter := counter + 1;
  END LOOP;

  -- Insert the new profile (Removed hardcoded Dicebear URL)
  INSERT INTO public.profiles (id, username, avatar_url, updated_at)
  VALUES (
    new.id,
    final_username,
    new.raw_user_meta_data->>'avatar_url', -- Use OAuth avatar if present, else NULL for "Ghost" fallback in UI
    now()
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Wipe any existing hardcoded Dicebear URLs in the database
UPDATE public.profiles 
SET avatar_url = NULL 
WHERE avatar_url LIKE '%dicebear.com%';

-- 4. Notify to reload schema (PostgREST)
NOTIFY pgrst, 'reload schema';
