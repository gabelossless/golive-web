-- scripts/engagement-rpcs.sql

-- 1. View Increment (Atomic)
CREATE OR REPLACE FUNCTION increment_view_count(video_id UUID, amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE videos
  SET view_count = COALESCE(view_count, 0) + amount
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Hype Increment (Atomic)
CREATE OR REPLACE FUNCTION increment_hype_count(video_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE videos
  SET hype_count = COALESCE(hype_count, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Toggle Like with Atomic Counter Update
CREATE OR REPLACE FUNCTION toggle_like(target_video_id UUID, target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  is_liked BOOLEAN;
BEGIN
  -- Check if already liked
  SELECT EXISTS (
    SELECT 1 FROM likes 
    WHERE video_id = target_video_id AND user_id = target_user_id
  ) INTO is_liked;

  IF is_liked THEN
    -- Unlike
    DELETE FROM likes WHERE video_id = target_video_id AND user_id = target_user_id;
    UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = target_video_id;
    RETURN jsonb_build_object('liked', false);
  ELSE
    -- Like
    INSERT INTO likes (video_id, user_id) VALUES (target_video_id, target_user_id);
    UPDATE videos SET likes_count = likes_count + 1 WHERE id = target_video_id;
    RETURN jsonb_build_object('liked', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
