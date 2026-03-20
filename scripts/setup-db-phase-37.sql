-- PHASE 37: PRODUCTION-HARDENED ANALYTICS & SECURITY
-- AUTHOR: Antigravity (Senior Dev)
-- DESCRIPTION: Addressing all critical attack surfaces identified in the audit.

-- 0. PRE-REQUISITES
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path = public;

-- 1. HARDENED WALLETS & TIPS (Economic Security)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS solana_wallet_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles (wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_solana_wallet ON public.profiles (solana_wallet_address) WHERE solana_wallet_address IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tip_transactions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chain           TEXT        NOT NULL CHECK (chain IN ('base', 'solana')),
    asset           TEXT        NOT NULL CHECK (asset IN ('native', 'usdc')),
    amount_raw      NUMERIC     NOT NULL CHECK (amount_raw > 0), -- Force numeric for precision
    tx_hash         TEXT        UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tip_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_tip" ON public.tip_transactions;
CREATE POLICY "insert_tip" ON public.tip_transactions 
    FOR INSERT WITH CHECK (auth.uid() = fan_user_id); -- Strict Identity Check

DROP POLICY IF EXISTS "read_own_tips" ON public.tip_transactions;
CREATE POLICY "read_own_tips" ON public.tip_transactions 
    FOR SELECT USING (creator_user_id = auth.uid() OR fan_user_id = auth.uid());

-- 2. HARDENED LIKES (Integrity)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'likes_video_user_unique') THEN
        ALTER TABLE public.likes ADD CONSTRAINT likes_video_user_unique UNIQUE(video_id, user_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.toggle_like(target_video_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_liked BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;

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

-- 3. HARDENED ANALYTICS (Anti-Farming)
CREATE TABLE IF NOT EXISTS public.video_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views BIGINT DEFAULT 0,
    watch_time_seconds BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    hypes BIGINT DEFAULT 0,
    unique_viewers BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(video_id, date)
);

CREATE TABLE IF NOT EXISTS public.video_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_hash TEXT,
    session_id TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.video_views_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_insert_log" ON public.video_views_log;
CREATE POLICY "system_insert_log" ON public.video_views_log FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "only_admins_view_logs" ON public.video_views_log;
CREATE POLICY "only_admins_view_logs" ON public.video_views_log FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.track_video_view(
    p_video_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_raw_ip TEXT := current_setting('request.headers', true)::json->>'x-real-ip';
    v_ip_hash TEXT;
    v_cooldown_interval INTERVAL := '12 hours';
    v_creator_id UUID;
    v_already_viewed BOOLEAN := false;
BEGIN
    IF v_raw_ip IS NULL THEN v_raw_ip := '127.0.0.1'; END IF;
    v_ip_hash := encode(digest(v_raw_ip, 'sha256'), 'hex');

    SELECT user_id INTO v_creator_id FROM public.videos WHERE id = p_video_id;
    IF v_creator_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Invalid target'); END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.video_views_log
        WHERE video_id = p_video_id
        AND (
            (v_user_id IS NOT NULL AND user_id = v_user_id)
            OR (p_session_id IS NOT NULL AND session_id = p_session_id)
            OR (v_ip_hash IS NOT NULL AND ip_hash = v_ip_hash)
        )
        AND created_at > now() - v_cooldown_interval
    ) INTO v_already_viewed;

    IF v_already_viewed THEN RETURN jsonb_build_object('success', true, 'incremented', false); END IF;

    INSERT INTO public.video_views_log (video_id, user_id, ip_hash, session_id, user_agent)
    VALUES (p_video_id, v_user_id, v_ip_hash, p_session_id, p_user_agent);

    UPDATE public.videos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_video_id;
    INSERT INTO public.video_daily_stats (video_id, date, views)
    VALUES (p_video_id, CURRENT_DATE, 1)
    ON CONFLICT (video_id, date) DO UPDATE SET views = video_daily_stats.views + 1;

    RETURN jsonb_build_object('success', true, 'incremented', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. HARDENED ADMIN TOOLS (Audit Audit Audit)
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

    UPDATE public.videos SET view_count = COALESCE(view_count, 0) + amount WHERE id = target_video_id;
    INSERT INTO public.admin_audit_log (admin_id, action, target_id, metadata)
    VALUES (auth.uid(), 'BOOST_VIDEO', target_video_id, jsonb_build_object('amount', amount));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. LOG RETENTION
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.video_views_log WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. POLICIES
DROP POLICY IF EXISTS "Creators see their own stats" ON public.video_daily_stats;
CREATE POLICY "Creators see their own stats" ON public.video_daily_stats
FOR SELECT USING (EXISTS (SELECT 1 FROM public.videos WHERE videos.id = video_daily_stats.video_id AND videos.user_id = auth.uid()));
