-- engagement-growth-rpcs.sql

-- 1. EXPAND VIDEOS TABLE FOR GROWTH TARGETS
-- These columns likely exist but let's ensure they have proper defaults
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS target_views BIGINT DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS target_likes BIGINT DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS growth_velocity INTEGER DEFAULT 0; -- views per hour

-- 2. DUMMY ACCOUNTS FLAG
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- 3. RPC: GENERATE DUMMY ACCOUNTS
-- Creates a batch of realistic-looking accounts
CREATE OR REPLACE FUNCTION generate_dummy_accounts(count INTEGER)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    new_id UUID;
    random_user TEXT;
BEGIN
    FOR i IN 1..count LOOP
        new_id := gen_random_uuid();
        random_user := 'viber_' || lower(substring(md5(random()), 1, 8));
        
        INSERT INTO public.profiles (
            id, 
            username, 
            display_name, 
            avatar_url, 
            is_verified, 
            is_dummy,
            bio
        ) VALUES (
            new_id,
            random_user,
            'Vibe ' || i,
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || random_user,
            (random() > 0.8), -- 20% chance of verification
            true,
            'Just here for the vibes. #VibeStream'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: TRIGGER GROWTH DRIP (Atomic)
-- This logic can be called by an external cron or manually to simulate organic growth
CREATE OR REPLACE FUNCTION process_growth_drip(batch_size INTEGER)
RETURNS TABLE (video_id UUID, views_added INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH targets AS (
        SELECT id
        FROM public.videos
        WHERE target_views > view_count
        ORDER BY random()
        LIMIT batch_size
    )
    UPDATE public.videos v
    SET view_count = view_count + floor(random() * 5 + 1)::BIGINT
    FROM targets
    WHERE v.id = targets.id
    RETURNING v.id, floor(random() * 5 + 1)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: BULK ENGAGEMENT
-- Dummy accounts engage with a specific video
CREATE OR REPLACE FUNCTION dummy_engage_video(target_video_id UUID, like_count INTEGER)
RETURNS VOID AS $$
DECLARE
    dummy_ids UUID[];
    d_id UUID;
    i INTEGER := 0;
BEGIN
    -- Get random dummy accounts
    SELECT array_agg(id) INTO dummy_ids FROM (
        SELECT id FROM public.profiles 
        WHERE is_dummy = true 
        ORDER BY random() 
        LIMIT like_count
    ) s;

    FOREACH d_id IN ARRAY dummy_ids LOOP
        -- Attempt to like (ignore if already liked)
        INSERT INTO public.likes (user_id, video_id)
        VALUES (d_id, target_video_id)
        ON CONFLICT DO NOTHING;
        
        -- Increment count if insert happened (simplified for RPC)
        IF FOUND THEN
            UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = target_video_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
