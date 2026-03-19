-- GoLive Natural Engagement System v2.0 - Schema Migration
-- Designed for High-Fidelity Social Simulation

-- 1. User Behavior Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'America/New_York',
  interests JSONB DEFAULT '{"primary": [], "secondary": [], "avoid": []}',
  engagement_style TEXT DEFAULT 'casual', -- lurker, engager, reactor, sharer
  activity_level FLOAT DEFAULT 0.5, -- 0-1 scale
  credibility_score FLOAT DEFAULT 1.0, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Social Relationships (Graph)
CREATE TABLE IF NOT EXISTS user_relationships (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_strength FLOAT DEFAULT 0.5, -- 0-1 scale
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 3. Content Intelligence (Scoring)
CREATE TABLE IF NOT EXISTS content_scores (
  video_id UUID PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  base_quality FLOAT DEFAULT 0.5,
  engagement_potential FLOAT DEFAULT 0.5,
  target_audience_size INT DEFAULT 100,
  performance_tier TEXT DEFAULT 'Average' -- Viral, Popular, Average, Underperforming
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_timezone ON user_profiles(timezone);
CREATE INDEX IF NOT EXISTS idx_user_relationships_following ON user_relationships(following_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scores ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Public read for simulation, user write)
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Relationships are viewable by everyone" ON user_relationships FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON user_relationships FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Scores are viewable by everyone" ON content_scores FOR SELECT USING (true);
