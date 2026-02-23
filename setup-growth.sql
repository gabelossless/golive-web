-- Growth Hacking Schema Updates

-- 1. Add Boost Columns to Videos
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS boosted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS target_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create Bots Table (to track which users are bots)
CREATE TABLE IF NOT EXISTS bots (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT NOT NULL
);

-- 3. RLS for Bots
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Bots" ON bots FOR SELECT USING (true);
-- Only Service Role or specific admins can insert bots normally, 
-- but for this script we might just insert manually or let the seeding script handle profile creation.

-- 4. RPC for Atomic View Increment
CREATE OR REPLACE FUNCTION increment_view_count(video_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE videos
  SET view_count = view_count + amount
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;
