-- scripts/phase-37-analytics.sql

-- 1. Video Daily Stats (Time-series data for charts)
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

-- Index for fast time-series retrieval
CREATE INDEX IF NOT EXISTS idx_vds_video_date ON public.video_daily_stats(video_id, date DESC);

-- 2. Video Views Log (Raw data for audit and deduplication)
CREATE TABLE IF NOT EXISTS public.video_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_hash TEXT,
    session_id TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for deduplication checks
CREATE INDEX IF NOT EXISTS idx_vvl_dedupe ON public.video_views_log(video_id, ip_hash, session_id, created_at DESC);

-- 3. Secure Track Video View RPC
-- This RPC handles incrementing the global view count AND the daily stats
-- while enforcing a 6-hour cooldown per IP/Session.
CREATE OR REPLACE FUNCTION public.track_video_view(
    p_video_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_ip_hash TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_cooldown_interval INTERVAL := '6 hours';
    v_last_view_time TIMESTAMP WITH TIME ZONE;
    v_creator_id UUID;
    v_already_viewed BOOLEAN := false;
BEGIN
    -- 1. Identify Creator
    SELECT user_id INTO v_creator_id FROM public.videos WHERE id = p_video_id;
    IF v_creator_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Video not found');
    END IF;

    -- 2. Check for recent views (Deduplication)
    -- We check if there's a log entry for this video + (ip_hash OR session_id OR user_id) within the last 6 hours
    SELECT EXISTS (
        SELECT 1 FROM public.video_views_log
        WHERE video_id = p_video_id
        AND (
            (p_user_id IS NOT NULL AND user_id = p_user_id)
            OR (p_session_id IS NOT NULL AND session_id = p_session_id)
            OR (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash)
        )
        AND created_at > now() - v_cooldown_interval
    ) INTO v_already_viewed;

    IF v_already_viewed THEN
        RETURN jsonb_build_object('success', true, 'message', 'View already tracked (cooldown active)', 'incremented', false);
    END IF;

    -- 3. Log the view
    INSERT INTO public.video_views_log (video_id, user_id, ip_hash, session_id, user_agent)
    VALUES (p_video_id, p_user_id, p_ip_hash, p_session_id, p_user_agent);

    -- 4. Increment Video View Count
    UPDATE public.videos
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_video_id;

    -- 5. Update Global daily_stats (for Creator)
    INSERT INTO public.daily_stats (user_id, date, views)
    VALUES (v_creator_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET views = daily_stats.views + 1;

    -- 6. Update Video specific daily_stats
    INSERT INTO public.video_daily_stats (video_id, date, views)
    VALUES (p_video_id, CURRENT_DATE, 1)
    ON CONFLICT (video_id, date)
    DO UPDATE SET views = video_daily_stats.views + 1;

    RETURN jsonb_build_object('success', true, 'message', 'View tracked successfully', 'incremented', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS and basic policies
ALTER TABLE public.video_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views_log ENABLE ROW LEVEL SECURITY;

-- Creators can see their own video stats
CREATE POLICY "Creators can view their own video daily stats" ON public.video_daily_stats
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.videos 
        WHERE videos.id = video_daily_stats.video_id 
        AND videos.user_id = auth.uid()
    )
);

-- Note: video_views_log is restricted to Service Role / Admin by default since it contains IP Hashes.
