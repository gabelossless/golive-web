-- ============================================================
-- Zenith Platform: Analytics & Settings Schema Migration
-- Phase 46 — Agent 1: Data Architect
-- Run manually in Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLE: video_events
-- Tracks individual video interaction events from clients.
-- Used for: watch time, completion rate, analytics pipeline.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id      TEXT NOT NULL,
    event_type      TEXT NOT NULL CHECK (event_type IN ('view', 'like', 'share', 'comment', 'complete', 'skip')),
    watch_seconds   INTEGER DEFAULT 0,   -- How many seconds watched (for 'view' events)
    device_type     TEXT,               -- 'mobile', 'desktop', 'tablet'
    country_code    TEXT,               -- ISO 3166 2-letter code (from IP geo or browser)
    referrer        TEXT,               -- Where the user came from
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_video_events_video_id     ON video_events(video_id);
CREATE INDEX IF NOT EXISTS idx_video_events_user_id      ON video_events(user_id);
CREATE INDEX IF NOT EXISTS idx_video_events_created_at   ON video_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_events_event_type   ON video_events(event_type);

-- RLS: Users can only insert their own events; admins can read all
ALTER TABLE video_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own events" ON video_events
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can read all events" ON video_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ────────────────────────────────────────────────────────────
-- TABLE: platform_reports
-- Daily snapshots of platform-wide stats.
-- Written by the /api/admin/stats API when an admin views the dashboard.
-- Used for: trend lines, growth charts, revenue tracking.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date         DATE NOT NULL UNIQUE, -- One row per day
    total_users         INTEGER DEFAULT 0,
    total_videos        INTEGER DEFAULT 0,
    total_views_today   INTEGER DEFAULT 0,
    total_likes_today   INTEGER DEFAULT 0,
    total_comments_today INTEGER DEFAULT 0,
    new_users_today     INTEGER DEFAULT 0,
    dau                 INTEGER DEFAULT 0,       -- Daily Active Users
    avg_watch_seconds   INTEGER DEFAULT 0,       -- Avg watch time from video_events
    total_uploads_today INTEGER DEFAULT 0,
    platform_revenue_usd NUMERIC(12,4) DEFAULT 0, -- Sum of tips in USD equivalent
    top_video_id        UUID REFERENCES videos(id) ON DELETE SET NULL,
    top_country_code    TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_reports_date ON platform_reports(report_date DESC);

-- RLS: Only admins can read/write
ALTER TABLE platform_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins only on platform_reports" ON platform_reports
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ────────────────────────────────────────────────────────────
-- TABLE: profile_settings
-- Stores per-user notification and privacy preferences.
-- Extended as a JSONB column for flexibility.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_settings (
    user_id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    -- Notification preferences
    notify_new_subscriber   BOOLEAN DEFAULT TRUE,
    notify_new_comment      BOOLEAN DEFAULT TRUE,
    notify_new_tip          BOOLEAN DEFAULT TRUE,
    notify_trending         BOOLEAN DEFAULT FALSE,
    notify_weekly_digest    BOOLEAN DEFAULT TRUE,
    -- Privacy preferences
    profile_public          BOOLEAN DEFAULT TRUE,
    show_wallet_address     BOOLEAN DEFAULT FALSE,
    allow_search_indexing   BOOLEAN DEFAULT TRUE,
    show_watch_history      BOOLEAN DEFAULT TRUE,
    -- Extra extensible data
    extra                   JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only see/edit their own settings
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings" ON profile_settings
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- RPC: get_platform_stats
-- Called by /api/admin/stats to compute a full stats snapshot.
-- Returns a single JSON object with all key metrics.
-- ────────────────────────────────────────────────────────────
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


-- ────────────────────────────────────────────────────────────
-- RPC Function: upsert_profile_settings
-- Ensures a row exists for a user (INSERT or UPDATE)
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- Done: Apply this file in Supabase > SQL Editor > Run
-- ────────────────────────────────────────────────────────────
