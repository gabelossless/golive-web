-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public posts are viewable by everyone" 
ON posts FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own posts" 
ON posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- Add simple relationship to profiles
-- (Implicit via user_id matching auth.users, but good to be explicit for joins if needed)
-- Note: Supabase handles auth.users joins automatically if configured, 
-- but we often join profiles table. 
-- Ensure foreign key to auth.users exists (done above).
