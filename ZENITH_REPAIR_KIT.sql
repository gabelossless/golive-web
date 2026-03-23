-- ============================================================
-- ZENITH UNIVERSAL MIGRATION & REPAIR KIT (V2)
-- Covers: Phase 46 (Analytics), Phase 46.5 (Uploads), Phase 47 (Live)
-- IDEMPOTENT: Can be run multiple times safely.
-- ============================================================

-- 1. BASE TABLES (IDEMPOTENT)
CREATE TABLE IF NOT EXISTS public.video_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id      TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    watch_seconds   INTEGER DEFAULT 0,
    device_type     TEXT,
    country_code    TEXT,
    referrer        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date         DATE NOT NULL UNIQUE,
    total_users         INTEGER DEFAULT 0,
    total_videos        INTEGER DEFAULT 0,
    total_views_today   INTEGER DEFAULT 0,
    total_likes_today   INTEGER DEFAULT 0,
    total_comments_today INTEGER DEFAULT 0,
    new_users_today     INTEGER DEFAULT 0,
    dau                 INTEGER DEFAULT 0,
    avg_watch_seconds   INTEGER DEFAULT 0,
    total_uploads_today INTEGER DEFAULT 0,
    platform_revenue_usd NUMERIC(12,4) DEFAULT 0,
    top_video_id        UUID REFERENCES videos(id) ON DELETE SET NULL,
    top_country_code    TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profile_settings (
    user_id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    notify_new_subscriber   BOOLEAN DEFAULT TRUE,
    notify_new_comment      BOOLEAN DEFAULT TRUE,
    notify_new_tip          BOOLEAN DEFAULT TRUE,
    notify_trending         BOOLEAN DEFAULT FALSE,
    notify_weekly_digest    BOOLEAN DEFAULT TRUE,
    profile_public          BOOLEAN DEFAULT TRUE,
    show_wallet_address     BOOLEAN DEFAULT FALSE,
    allow_search_indexing   BOOLEAN DEFAULT TRUE,
    show_watch_history      BOOLEAN DEFAULT TRUE,
    extra                   JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. COLUMN ADDITIONS (SAFE GUARDS)
DO $$ 
BEGIN 
    -- Profiles Updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_tier') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stream_key') THEN
        ALTER TABLE public.profiles ADD COLUMN stream_key TEXT;
    END IF;

    -- Videos Updates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='is_live') THEN
        ALTER TABLE public.videos ADD COLUMN is_live BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='category') THEN
        ALTER TABLE public.videos ADD COLUMN category TEXT DEFAULT 'General';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='playback_id') THEN
        ALTER TABLE public.videos ADD COLUMN playback_id TEXT;
    END IF;
END $$;

-- 3. DATA MIGRATION
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        UPDATE public.profiles SET role = 'admin' WHERE is_admin = true AND role = 'user';
    END IF;
END $$;

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_video_events_video_id     ON public.video_events(video_id);
CREATE INDEX IF NOT EXISTS idx_video_events_created_at   ON public.video_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_reports_date      ON public.platform_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_live_chat_video_id        ON public.live_chat_messages(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_is_live            ON public.videos(is_live) WHERE is_live = true;

-- 5. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users',          (SELECT COUNT(*) FROM profiles),
        'total_videos',         (SELECT COUNT(*) FROM videos),
        'total_views',          (SELECT COALESCE(SUM(view_count), 0) FROM videos),
        'total_likes',          (SELECT COUNT(*) FROM likes),
        'total_comments',       (SELECT COUNT(*) FROM comments),
        'new_users_today',      (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE),
        'new_videos_today',     (SELECT COUNT(*) FROM videos  WHERE created_at >= CURRENT_DATE),
        'dau',                  (SELECT COUNT(DISTINCT user_id) FROM video_events WHERE created_at >= CURRENT_DATE),
        'views_today',          (SELECT COUNT(*) FROM video_events WHERE event_type = 'view' AND created_at >= CURRENT_DATE),
        'likes_today',          (SELECT COUNT(*) FROM video_events WHERE event_type = 'like' AND created_at >= CURRENT_DATE),
        'avg_watch_seconds',    (SELECT COALESCE(AVG(watch_seconds), 0)::INT FROM video_events WHERE event_type = 'view' AND created_at >= NOW() - INTERVAL '7 days'),
        'top_video',            (SELECT json_build_object('id', id, 'title', title, 'view_count', view_count) FROM videos ORDER BY view_count DESC LIMIT 1),
        'top_countries',        (SELECT json_agg(t) FROM (SELECT country_code, COUNT(*) as views FROM video_events WHERE created_at >= NOW() - INTERVAL '30 days' AND country_code IS NOT NULL GROUP BY country_code ORDER BY views DESC LIMIT 5) t),
        'device_distribution',  (SELECT json_agg(t) FROM (SELECT device_type, COUNT(*) as count FROM video_events WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY device_type) t),
        'views_last_30_days',   (SELECT json_agg(t) FROM (SELECT DATE(created_at) as date, COUNT(*) as views FROM video_events WHERE event_type = 'view' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY date ORDER BY date ASC) t)
    ) INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_profile_settings(
    p_user_id UUID,
    p_notify_new_subscriber BOOLEAN DEFAULT TRUE,
    p_notify_new_comment BOOLEAN DEFAULT TRUE,
    p_notify_new_tip BOOLEAN DEFAULT TRUE,
    p_notify_trending BOOLEAN DEFAULT FALSE,
    p_notify_weekly_digest BOOLEAN DEFAULT TRUE,
    p_profile_public BOOLEAN DEFAULT TRUE,
    p_show_wallet_address BOOLEAN DEFAULT FALSE,
    p_allow_search_indexing BOOLEAN DEFAULT TRUE,
    p_show_watch_history BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profile_settings (
        user_id, notify_new_subscriber, notify_new_comment, notify_new_tip,
        notify_trending, notify_weekly_digest, profile_public,
        show_wallet_address, allow_search_indexing, show_watch_history, updated_at
    ) VALUES (
        p_user_id, p_notify_new_subscriber, p_notify_new_comment, p_notify_new_tip,
        p_notify_trending, p_notify_weekly_digest, p_profile_public,
        p_show_wallet_address, p_allow_search_indexing, p_show_watch_history, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        notify_new_subscriber = EXCLUDED.notify_new_subscriber,
        notify_new_comment    = EXCLUDED.notify_new_comment,
        notify_new_tip        = EXCLUDED.notify_new_tip,
        notify_trending       = EXCLUDED.notify_trending,
        notify_weekly_digest  = EXCLUDED.notify_weekly_digest,
        profile_public        = EXCLUDED.profile_public,
        show_wallet_address   = EXCLUDED.show_wallet_address,
        allow_search_indexing = EXCLUDED.allow_search_indexing,
        show_watch_history    = EXCLUDED.show_watch_history,
        updated_at            = NOW();
END;
$$;

-- 6. RLS POLICIES (SAFE CREATION)
ALTER TABLE video_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can log their own events') THEN
        CREATE POLICY "Users can log their own events" ON video_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all events') THEN
        CREATE POLICY "Admins can read all events" ON video_events FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins only on platform_reports') THEN
        CREATE POLICY "Admins only on platform_reports" ON platform_reports USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own settings') THEN
        CREATE POLICY "Users manage own settings" ON profile_settings USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public view live chat') THEN
        CREATE POLICY "Public view live chat" ON live_chat_messages FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth post live chat') THEN
        CREATE POLICY "Auth post live chat" ON live_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
