-- scripts/phase-38-vibe-guard.sql
-- AUTHOR: Antigravity (Senior Dev)
-- THEME: "The Vibe Guard" - Production-Hardened Defensive Architecture

-- 0. PRE-REQUISITES
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path = public;

-- 0.1 ADMIN ROLES FOUNDATION (Atomic Deployment)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

DROP FUNCTION IF EXISTS public.is_admin();
CREATE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT is_admin FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. SIGNAL LAYER: Vibe Events (Aggregated audit trail)
CREATE TABLE IF NOT EXISTS public.vibe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    ip_hash TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_high_risk BOOLEAN DEFAULT false,
    is_system_action BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vibe_user_time ON public.vibe_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_ip_time ON public.vibe_events(ip_hash, created_at DESC);

-- 🔒 Hardened RLS: Only Service Role (Backend) can insert logs
ALTER TABLE public.vibe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_insert_vibe" ON public.vibe_events;
CREATE POLICY "system_insert_vibe" ON public.vibe_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "admins_view_vibe" ON public.vibe_events;
CREATE POLICY "admins_view_vibe" ON public.vibe_events FOR SELECT USING (public.is_admin());

-- 2. REPUTATION & WHITELIST LAYER
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vibe_score INT DEFAULT 0; 
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_creator BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_system_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partnership_level INT DEFAULT 0;

-- 3. BRAIN LAYER: Pulse Detection
DROP FUNCTION IF EXISTS public.get_vibe_pulse();
CREATE FUNCTION public.get_vibe_pulse()
RETURNS NUMERIC AS $$
DECLARE
    v_recent_activity INT;
    v_avg_activity INT;
BEGIN
    SELECT COUNT(*) INTO v_recent_activity FROM public.vibe_events WHERE created_at > now() - interval '5 minutes';
    SELECT (COUNT(*) / 12) INTO v_avg_activity FROM public.vibe_events WHERE created_at > now() - interval '1 hour';
    IF v_avg_activity = 0 THEN RETURN 1.0; END IF;
    RETURN LEAST(2.5, GREATEST(1.0, v_recent_activity::NUMERIC / v_avg_activity::NUMERIC));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. BRAIN LAYER: Risk Scoring
DROP FUNCTION IF EXISTS public.get_vibe_score(UUID, TEXT);
CREATE FUNCTION public.get_vibe_score(p_user_id UUID, p_ip_hash TEXT)
RETURNS INT AS $$
DECLARE
    v_is_system BOOLEAN;
    v_views_24h INT := 0;
    v_ips_24h INT := 0;
    v_tips_24h INT := 0;
    v_score INT := 0;
    v_pulse NUMERIC := public.get_vibe_pulse();
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT is_system_verified INTO v_is_system FROM public.profiles WHERE id = p_user_id;
        IF v_is_system OR public.is_admin() THEN RETURN 0; END IF;
    END IF;
    SELECT COUNT(*) FILTER (WHERE event_type = 'view'), 
           COUNT(DISTINCT ip_hash),
           COUNT(*) FILTER (WHERE event_type = 'tip')
    INTO v_views_24h, v_ips_24h, v_tips_24h
    FROM public.vibe_events
    WHERE (user_id = p_user_id OR ip_hash = p_ip_hash)
    AND created_at > now() - interval '24 hours';
    IF v_views_24h > (200 * v_pulse) THEN v_score := v_score + 30; END IF;
    IF v_ips_24h > (10 * v_pulse) THEN v_score := v_score + 25; END IF;
    IF v_tips_24h > 20 THEN v_score := v_score + 40; END IF;
    RETURN LEAST(100, COALESCE(v_score, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. DEFENSE LAYER: Multi-Role Engagement Flow
DROP FUNCTION IF EXISTS public.process_vibe_event(UUID, TEXT, TEXT, JSONB);
CREATE FUNCTION public.process_vibe_event(
    p_video_id UUID,
    p_event_type TEXT,
    p_session_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_raw_ip TEXT := current_setting('request.headers', true)::json->>'x-real-ip';
    v_ip_hash TEXT;
    v_risk_score INT;
    v_is_high_risk BOOLEAN := false;
    v_is_system BOOLEAN := false;
BEGIN
    IF v_raw_ip IS NULL THEN v_raw_ip := '127.0.0.1'; END IF;
    v_ip_hash := encode(digest(v_raw_ip, 'sha256'), 'hex');
    IF v_user_id IS NOT NULL THEN
        SELECT is_system_verified INTO v_is_system FROM public.profiles WHERE id = v_user_id;
        IF v_is_system OR public.is_admin() THEN v_risk_score := 0; v_is_system := true;
        ELSE v_risk_score := public.get_vibe_score(v_user_id, v_ip_hash); END IF;
    ELSE v_risk_score := public.get_vibe_score(NULL, v_ip_hash); END IF;
    IF v_risk_score > 70 THEN v_is_high_risk := true; END IF;
    INSERT INTO public.vibe_events (user_id, event_type, video_id, ip_hash, session_id, metadata, is_high_risk, is_system_action)
    VALUES (v_user_id, p_event_type, p_video_id, v_ip_hash, p_session_id, p_metadata, v_is_high_risk, v_is_system);
    IF v_is_high_risk AND NOT v_is_system THEN RETURN jsonb_build_object('success', true, 'status', 'buffered'); END IF;
    IF p_event_type = 'view' AND p_video_id IS NOT NULL THEN
        UPDATE public.videos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_video_id;
        INSERT INTO public.video_daily_stats (video_id, date, views)
        VALUES (p_video_id, CURRENT_DATE, 1)
        ON CONFLICT (video_id, date) DO UPDATE SET views = video_daily_stats.views + 1;
    END IF;
    RETURN jsonb_build_object('success', true, 'status', 'verified');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. HARDENED TOGGLE LIKE (Production Ready)
DROP FUNCTION IF EXISTS public.toggle_like(UUID);
CREATE FUNCTION public.toggle_like(target_video_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_liked BOOLEAN;
    v_vibe_status JSONB;
BEGIN
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;
    v_vibe_status := public.process_vibe_event(target_video_id, 'like', NULL);
    IF (v_vibe_status->>'status') = 'buffered' THEN RETURN jsonb_build_object('success', true, 'liked', true, 'status', 'buffered'); END IF;
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

-- 7. HARDENED INCREMENT HYPE (Production Ready)
DROP FUNCTION IF EXISTS public.increment_hype_count(UUID);
CREATE FUNCTION public.increment_hype_count(video_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_vibe_status JSONB;
BEGIN
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;
    v_vibe_status := public.process_vibe_event(video_id, 'hype', NULL);
    IF (v_vibe_status->>'status') = 'buffered' THEN RETURN jsonb_build_object('success', true, 'status', 'buffered'); END IF;
    UPDATE public.videos SET hype_count = COALESCE(hype_count, 0) + 1 WHERE id = video_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. HARDENED CRYPTO TIP (Economic Guard)
DROP FUNCTION IF EXISTS public.process_crypto_tip(UUID, NUMERIC, TEXT, TEXT, TEXT);
CREATE FUNCTION public.process_crypto_tip(
    p_creator_id UUID,
    p_amount NUMERIC,
    p_tx_hash TEXT,
    p_chain TEXT DEFAULT 'solana',
    p_asset TEXT DEFAULT 'native'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;
    IF p_amount <= 0 THEN RETURN jsonb_build_object('error', 'Invalid amount'); END IF;
    IF p_tx_hash IS NULL OR p_tx_hash = '' THEN RETURN jsonb_build_object('error', 'TX hash required'); END IF;
    INSERT INTO public.tip_transactions (fan_user_id, creator_user_id, chain, asset, amount_raw, tx_hash)
    VALUES (v_user_id, p_creator_id, p_chain, p_asset, p_amount, p_tx_hash);
    PERFORM public.process_vibe_event(NULL, 'tip', NULL, jsonb_build_object('amount', p_amount, 'tx_hash', p_tx_hash));
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. ADMIN BOOST & AUDIT
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

DROP FUNCTION IF EXISTS public.admin_boost_video(UUID, INTEGER);
CREATE FUNCTION public.admin_boost_video(target_video_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized: Vibe Guard active.'; END IF;
    IF amount > 10000 THEN RAISE EXCEPTION 'Boost limit exceeded.'; END IF;
    IF amount <= 0 THEN RAISE EXCEPTION 'Invalid vibe amount.'; END IF;
    UPDATE public.videos SET view_count = COALESCE(view_count, 0) + amount WHERE id = target_video_id;
    INSERT INTO public.admin_audit_log (admin_id, action, target_id, metadata)
    VALUES (auth.uid(), 'BOOST_VIDEO', target_video_id, jsonb_build_object('amount', amount, 'audit_source', 'vibe_guard_v38_hardened'));
    INSERT INTO public.video_daily_stats (video_id, date, views)
    VALUES (target_video_id, CURRENT_DATE, amount)
    ON CONFLICT (video_id, date) DO UPDATE SET views = video_daily_stats.views + amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
