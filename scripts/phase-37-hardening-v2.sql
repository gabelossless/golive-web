-- scripts/phase-37-hardening-v2.sql
-- AUTHOR: Antigravity (Senior Dev)
-- PURPOSE: Address critical security vulnerabilities identified in the audit.

SET search_path = public;

-- 1. HARDEN TIP TRANSACTIONS (Economic Security)
-- Use NUMERIC for precision, check for positive amounts.
ALTER TABLE public.tip_transactions 
    ALTER COLUMN amount_raw TYPE NUMERIC USING amount_raw::NUMERIC,
    ADD CONSTRAINT tip_amount_positive CHECK (amount_raw > 0);

-- Enforce fan_user_id on INSERT
DROP POLICY IF EXISTS "insert_tip" ON public.tip_transactions;
CREATE POLICY "insert_tip" ON public.tip_transactions 
    FOR INSERT WITH CHECK (auth.uid() = fan_user_id);

-- 2. HARDEN LIKES (Integrity)
-- Prevent double-likes via database constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'likes_video_user_unique') THEN
        ALTER TABLE public.likes ADD CONSTRAINT likes_video_user_unique UNIQUE(video_id, user_id);
    END IF;
END $$;

-- Refactor toggle_like to exclude user_id parameter (Trust auth.uid() ONLY)
CREATE OR REPLACE FUNCTION public.toggle_like(target_video_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_liked BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF EXISTS (SELECT 1 FROM public.likes WHERE video_id = target_video_id AND user_id = v_user_id) THEN
        DELETE FROM public.likes WHERE video_id = target_video_id AND user_id = v_user_id;
        UPDATE public.videos SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = target_video_id;
        v_liked := false;
    ELSE
        INSERT INTO public.likes (video_id, user_id) VALUES (target_video_id, v_user_id);
        UPDATE public.videos SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = target_video_id;
        v_liked := true;
    END IF;

    RETURN jsonb_build_object('success', true, 'liked', v_liked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. HARDEN ANALYTICS (Anti-Farming)
-- Add explicit RLS to video_views_log
ALTER TABLE public.video_views_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_insert_log" ON public.video_views_log;
CREATE POLICY "system_insert_log" ON public.video_views_log FOR INSERT WITH CHECK (true); -- Still needed for anon views, but protected by the RPC logic
DROP POLICY IF EXISTS "only_admins_view_logs" ON public.video_views_log;
CREATE POLICY "only_admins_view_logs" ON public.video_views_log FOR SELECT USING (public.is_admin());

-- Refactor track_video_view for stricter validation
CREATE OR REPLACE FUNCTION public.track_video_view(
    p_video_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_ip_text TEXT := current_setting('request.headers', true)::json->>'x-real-ip'; -- Server-side IP detection (Supabase specific)
    v_cooldown_interval INTERVAL := '12 hours'; -- Increased cooldown to 12h
    v_creator_id UUID;
    v_already_viewed BOOLEAN := false;
BEGIN
    -- 1. Validate Privacy/Security Path
    SET search_path = public;

    -- 2. Validate Video
    SELECT user_id INTO v_creator_id FROM public.videos WHERE id = p_video_id;
    IF v_creator_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid target');
    END IF;

    -- 3. Strict Deduplication (Use server detection where possible)
    SELECT EXISTS (
        SELECT 1 FROM public.video_views_log
        WHERE video_id = p_video_id
        AND (
            (v_user_id IS NOT NULL AND user_id = v_user_id)
            OR (p_session_id IS NOT NULL AND session_id = p_session_id)
            OR (v_ip_text IS NOT NULL AND ip_hash = encode(digest(v_ip_text, 'sha256'), 'hex'))
        )
        AND created_at > now() - v_cooldown_interval
    ) INTO v_already_viewed;

    IF v_already_viewed THEN
        RETURN jsonb_build_object('success', true, 'incremented', false);
    END IF;

    -- 4. Log and Increment
    INSERT INTO public.video_views_log (video_id, user_id, ip_hash, session_id, user_agent)
    VALUES (p_video_id, v_user_id, encode(digest(v_ip_text, 'sha256'), 'hex'), p_session_id, p_user_agent);

    UPDATE public.videos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_video_id;

    INSERT INTO public.video_daily_stats (video_id, date, views)
    VALUES (p_video_id, CURRENT_DATE, 1)
    ON CONFLICT (video_id, date) DO UPDATE SET views = video_daily_stats.views + 1;

    RETURN jsonb_build_object('success', true, 'incremented', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. HARDEN ADMIN BOOST (Audit Trail)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.admin_boost_video(target_video_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    IF amount > 10000 THEN RAISE EXCEPTION 'Boost limit exceeded (Max 10k)'; END IF;

    -- Update Stats
    UPDATE public.videos SET view_count = COALESCE(view_count, 0) + amount WHERE id = target_video_id;
    
    -- Audit Log
    INSERT INTO public.admin_audit_log (admin_id, action, target_id, metadata)
    VALUES (auth.uid(), 'BOOST_VIDEO', target_video_id, jsonb_build_object('amount', amount));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. LOG RETENTION (Storage Security)
-- Cleanup logs older than 30 days to prevent DoS via storage bloat
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.video_views_log WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
