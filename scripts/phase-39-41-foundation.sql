-- scripts/phase-39-41-foundation.sql
-- AUTHOR: Antigravity (Senior Dev)
-- THEME: Creator Liquidity (Phase 39) & Viral Social (Phase 41)

SET search_path = public;

-- 1. PHASE 39: CREATOR LIQUIDITY
-- Add payout addresses for non-custodial distributions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS solana_payout_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS evm_payout_address TEXT;

-- Add Livepeer metadata for premium transcoding
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS livepeer_playback_id TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_livepeer_ready BOOLEAN DEFAULT false;

-- 2. PHASE 41: VIRAL SOCIAL (VIBE POINTS)
-- Table to track engagement "Vibe Points" (Off-chain virtual credits)
CREATE TABLE IF NOT EXISTS public.vibe_points_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL, -- 'hype', 'view_streak', 'referral', 'premium_bonus'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast point aggregation
CREATE INDEX IF NOT EXISTS idx_vibe_points_user ON public.vibe_points_log(user_id, created_at DESC);

-- View for User Point Balances
CREATE OR REPLACE VIEW public.user_points_summary AS
SELECT 
    user_id,
    SUM(points) as total_points,
    MAX(created_at) as last_activity
FROM public.vibe_points_log
GROUP BY user_id;

-- 3. PERMISSIONS
ALTER TABLE public.vibe_events ENABLE ROW LEVEL SECURITY;
-- (vibe_events policies already handled in Phase 38)

ALTER TABLE public.vibe_points_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own_points" ON public.vibe_points_log;
CREATE POLICY "users_view_own_points" ON public.vibe_points_log FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "admins_manage_points" ON public.vibe_points_log;
CREATE POLICY "admins_manage_points" ON public.vibe_points_log ALL USING (public.is_admin());

-- 5. AUTOMATED REWARDS (Phase 41)
-- Update toggle_like to award points
CREATE OR REPLACE FUNCTION public.toggle_like(target_video_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_liked BOOLEAN;
    v_vibe_status JSONB;
BEGIN
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;

    v_vibe_status := public.process_vibe_event(target_video_id, 'like', NULL);
    
    IF (v_vibe_status->>'status') = 'buffered' THEN
        RETURN jsonb_build_object('success', true, 'liked', true, 'status', 'buffered');
    END IF;

    IF EXISTS (SELECT 1 FROM public.likes WHERE video_id = target_video_id AND user_id = v_user_id) THEN
        DELETE FROM public.likes WHERE video_id = target_video_id AND user_id = v_user_id;
        UPDATE public.videos SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = target_video_id;
        v_liked := false;
    ELSE
        INSERT INTO public.likes (video_id, user_id) VALUES (target_video_id, v_user_id);
        UPDATE public.videos SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = target_video_id;
        v_liked := true;
        -- AWARD POINTS: 5 Vibe Points per verified Like
        PERFORM public.award_vibe_points(v_user_id, 5, 'like');
    END IF;

    RETURN jsonb_build_object('success', true, 'liked', v_liked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update increment_hype_count to award points
CREATE OR REPLACE FUNCTION public.increment_hype_count(video_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_vibe_status JSONB;
BEGIN
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'Unauthorized'); END IF;

    v_vibe_status := public.process_vibe_event(video_id, 'hype', NULL);
    
    IF (v_vibe_status->>'status') = 'buffered' THEN
        RETURN jsonb_build_object('success', true, 'status', 'buffered');
    END IF;

    UPDATE public.videos SET hype_count = COALESCE(hype_count, 0) + 1 WHERE id = video_id;

    -- AWARD POINTS: 10 Vibe Points per verified Hype
    PERFORM public.award_vibe_points(v_user_id, 10, 'hype');

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
