-- Admin DB Patch: Functions to instantly increase engagement stimulus

-- 1. Check if video has likes_count column
-- Actually, GoLive uses a 'likes' table but we can add a 'likes_count' cache if not exists 
-- or just insert fake likes. The easiest way for a sudden 'stimulus' is just a cached value 
-- if the frontend uses a direct column, or to insert records.
-- Let's check how WatchClient gets likes:
-- WatchClient uses: `const [likes, setLikes] = useState(initialVideo.target_likes || 0);`
-- This means if we update `target_likes` and `view_count`, it immediately changes!

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_subs INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS target_likes INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS target_views INTEGER DEFAULT 0;

-- RPC to instantly increase views and target likes for a video
CREATE OR REPLACE FUNCTION admin_boost_video(p_video_id UUID, p_views INTEGER, p_likes INTEGER)
RETURNS VOID AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Verify admin
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email NOT IN ('gabelossless@gmail.com', 'roadadventure@gmail.com') THEN
    RAISE EXCEPTION 'Unauthorized: only admins can perform this action';
  END IF;

  -- Increase actual views
  UPDATE public.videos
  SET view_count = coalesce(view_count, 0) + p_views,
      target_views = coalesce(target_views, 0) + p_views,
      target_likes = coalesce(target_likes, 0) + p_likes
  WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to instantly increase target subs for a channel/profile
CREATE OR REPLACE FUNCTION admin_boost_channel(p_profile_id UUID, p_subs INTEGER)
RETURNS VOID AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Verify admin
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email NOT IN ('gabelossless@gmail.com', 'roadadventure@gmail.com') THEN
    RAISE EXCEPTION 'Unauthorized: only admins can perform this action';
  END IF;

  UPDATE public.profiles
  SET target_subs = coalesce(target_subs, 0) + p_subs
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
