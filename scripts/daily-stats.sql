-- scripts/daily-stats.sql

-- 1. Create daily_stats table
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    revenue_usdc NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, date)
);

-- 2. Update increment_view_count to log to daily_stats
CREATE OR REPLACE FUNCTION increment_view_count(video_id UUID, amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
DECLARE
    creator_id UUID;
BEGIN
    -- Update video count
    UPDATE videos
    SET view_count = COALESCE(view_count, 0) + amount
    WHERE id = video_id
    RETURNING user_id INTO creator_id;

    -- Update/Insert daily stats
    INSERT INTO daily_stats (user_id, date, views)
    VALUES (creator_id, CURRENT_DATE, amount)
    ON CONFLICT (user_id, date)
    DO UPDATE SET views = daily_stats.views + amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Automatic "Slow Drip" Engagement RPC
-- Increments views by 1-5 for all "boosted" or recent videos with < 50 views.
CREATE OR REPLACE FUNCTION drip_global_engagement()
RETURNS VOID AS $$
DECLARE
    v_record RECORD;
    v_amount INTEGER;
BEGIN
    FOR v_record IN 
        SELECT id, user_id 
        FROM videos 
        WHERE (created_at > now() - interval '7 days' AND COALESCE(view_count, 0) < 50)
           OR boosted = true
    LOOP
        v_amount := floor(random() * 5 + 1)::int;
        PERFORM increment_view_count(v_record.id, v_amount);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin engagement trigger (specific video)
CREATE OR REPLACE FUNCTION admin_boost_video(target_video_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    PERFORM increment_view_count(target_video_id, amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
