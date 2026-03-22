-- scripts/premium-tier-limits.sql
-- AUTHOR: Antigravity (Senior Dev)
-- THEME: Premium Tier Limits & Data Retention Policy

SET search_path = public;

-- 1. SCHEMA UPDATES
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration INTEGER; -- Duration in seconds
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ; -- Track when a user downgraded to free

-- 2. LIMITS CONFIGURATION (Helper Function)
CREATE OR REPLACE FUNCTION public.get_user_upload_limits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT subscription_tier INTO v_tier FROM public.profiles WHERE id = p_user_id;
    
    IF v_tier = 'premium' THEN
        RETURN jsonb_build_object(
            'shorts_max_seconds', 60,
            'long_form_max_seconds', 3600, -- 60 minutes
            'tier', 'premium'
        );
    ELSE
        RETURN jsonb_build_object(
            'shorts_max_seconds', 30,
            'long_form_max_seconds', 360, -- 6 minutes
            'tier', 'free'
        );
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. AUTOMATED DATA RETENTION (31-Day Deletion)
-- This function identifies and deletes "over-limit" videos for users who downgraded > 31 days ago.
CREATE OR REPLACE FUNCTION public.cleanup_downgraded_videos()
RETURNS void AS $$
DECLARE
    v_standard_shorts_limit INTEGER := 30;
    v_standard_long_limit INTEGER := 360;
BEGIN
    -- Delete videos belonging to users who downgraded more than 31 days ago
    -- if those videos exceed the standard free tier limits.
    DELETE FROM public.videos
    WHERE user_id IN (
        SELECT id FROM public.profiles 
        WHERE subscription_tier = 'free' 
        AND downgraded_at IS NOT NULL 
        AND downgraded_at < now() - interval '31 days'
    )
    AND (
        (is_short = true AND duration > v_standard_shorts_limit) OR
        (is_short = false AND duration > v_standard_long_limit)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: In a production Supabase environment, you would schedule this using pg_cron:
-- SELECT cron.schedule('0 0 * * *', 'SELECT public.cleanup_downgraded_videos()');
