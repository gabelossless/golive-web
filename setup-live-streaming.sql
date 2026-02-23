-- Add is_live column to videos table
ALTER TABLE videos ADD COLUMN is_live BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN category TEXT; -- Adding category while we're at it

-- Create Live Chat Messages table
-- Separate from comments to keep VOD comments clean and allow faster/simpler queries
CREATE TABLE live_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Live Chat
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can view chat
CREATE POLICY "Public view live chat" ON live_chat_messages FOR SELECT USING (true);

-- Authenticated users can post to chat
CREATE POLICY "Auth post live chat" ON live_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Create an index for faster lookups by video_id
CREATE INDEX idx_live_chat_video_id ON live_chat_messages(video_id);
