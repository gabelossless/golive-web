-- GOLive Natural Engagement System v2.0
-- BOT POPULATION & SOCIAL GRAPH GENERATOR
-- Run this in the Supabase SQL Editor

-- 1. Initialize Profiles for all existing 'bot' users
-- Assume bots have usernames like 'bot_...' or are just standard users we want to simulate
INSERT INTO user_profiles (user_id, timezone, engagement_style, activity_level)
SELECT 
    id, 
    (ARRAY['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Los_Angeles', 'Australia/Sydney'])[floor(random() * 5 + 1)],
    (ARRAY['lurker', 'engager', 'reactor', 'sharer'])[floor(random() * 4 + 1)],
    random()
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- 2. Assign Interests (JSONB)
UPDATE user_profiles
SET interests = jsonb_build_object(
    'primary', (SELECT jsonb_agg(x) FROM (SELECT unnest(ARRAY['Gaming', 'Tech', 'Music', 'Cooking', 'Comedy']) ORDER BY random() LIMIT 2) t(x)),
    'secondary', (SELECT jsonb_agg(x) FROM (SELECT unnest(ARRAY['Fitness', 'DIY', 'Motivation', 'Science']) ORDER BY random() LIMIT 2) t(x)),
    'avoid', '[]'::jsonb
)
WHERE interests = '{"primary": [], "secondary": [], "avoid": []}'::jsonb;

-- 3. Generate Social Graph (Power Law)
-- Let's pick 5 'Influencer' bots
WITH influencers AS (
    SELECT user_id FROM user_profiles ORDER BY random() LIMIT 5
),
everyone_else AS (
    SELECT user_id FROM user_profiles WHERE user_id NOT IN (SELECT user_id FROM influencers)
)
INSERT INTO user_relationships (follower_id, following_id, relationship_strength)
SELECT 
    e.user_id,
    i.user_id,
    random()
FROM everyone_else e
CROSS JOIN influencers i
ON CONFLICT DO NOTHING;

-- 4. Random clusters (Mutual follows)
INSERT INTO user_relationships (follower_id, following_id, relationship_strength)
SELECT 
    a.user_id,
    b.user_id,
    random()
FROM user_profiles a
JOIN user_profiles b ON a.user_id != b.user_id
WHERE random() < 0.05 -- 5% chance of random connection
ON CONFLICT DO NOTHING;

-- 5. Content Discovery Intelligence (Pre-score existing videos)
INSERT INTO content_scores (video_id, base_quality, engagement_potential, performance_tier)
SELECT 
    id,
    random(),
    random(),
    (ARRAY['Viral', 'Popular', 'Average', 'Underperforming'])[floor(random() * 4 + 1)]
FROM videos
ON CONFLICT (video_id) DO NOTHING;
