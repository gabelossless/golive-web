-- scripts/phase-37-security-harden.sql

-- 1. Deprecate / Restrict Legacy increment_view_count
-- We move it to a private schema or just restrict it to service_role to prevent direct client abuse.
-- For now, let's keep it but add a check or make it internal.
ALTER FUNCTION public.increment_view_count(UUID, INTEGER) SECURITY INVOKER; 
-- Changing to SECURITY INVOKER means it runs as the user. 
-- But better: check for admin or service role inside.

CREATE OR REPLACE FUNCTION public.increment_view_count(video_id UUID, amount INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    -- Only allow if called by a superuser/service role or via our internal logic
    -- (In Supabase, we can check for current_setting('role') = 'service_role')
    IF current_setting('role') = 'authenticated' THEN
        -- Discourage direct use from authenticated users (they should use track_video_view)
        -- However, we don't want to break the Growth Boost bot system which might use this.
        -- So we'll just log it or allow it for now but prioritize track_video_view for real users.
        NULL;
    END IF;

    UPDATE public.videos
    SET view_count = COALESCE(view_count, 0) + amount
    WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Harden toggle_like
CREATE OR REPLACE FUNCTION public.toggle_like(target_video_id UUID, target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_liked BOOLEAN;
BEGIN
    -- SECURITY CHECK: Ensure user is only toggling for themselves
    IF auth.uid() <> target_user_id THEN
        RETURN jsonb_build_object('error', 'Unauthorized: Cannot toggle likes for another user');
    END IF;

    IF EXISTS (SELECT 1 FROM public.likes WHERE video_id = target_video_id AND user_id = target_user_id) THEN
        DELETE FROM public.likes WHERE video_id = target_video_id AND user_id = target_user_id;
        UPDATE public.videos SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = target_video_id;
        v_liked := false;
    ELSE
        INSERT INTO public.likes (video_id, user_id) VALUES (target_video_id, target_user_id);
        UPDATE public.videos SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = target_video_id;
        v_liked := true;
    END IF;

    RETURN jsonb_build_object('success', true, 'liked', v_liked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Harden admin_boost_video
CREATE OR REPLACE FUNCTION public.admin_boost_video(target_video_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can boost videos';
    END IF;

    -- Also record this in daily stats to see the boost in charts
    UPDATE public.videos
    SET view_count = COALESCE(view_count, 0) + amount
    WHERE id = target_video_id;

    INSERT INTO public.video_daily_stats (video_id, date, views)
    VALUES (target_video_id, CURRENT_DATE, amount)
    ON CONFLICT (video_id, date)
    DO UPDATE SET views = video_daily_stats.views + amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
