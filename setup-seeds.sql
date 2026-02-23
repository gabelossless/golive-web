-- GoLive Master Seeding & Growth Setup
-- This script is self-contained: It creates tables, columns, and 50 seed users.
-- Run this in the Supabase SQL Editor.

-- 1. Ensure Growth Columns exist in Videos
ALTER TABLE IF EXISTS public.videos 
ADD COLUMN IF NOT EXISTS boosted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS target_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Ensure Bots Table exists
CREATE TABLE IF NOT EXISTS public.bots (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT NOT NULL
);

-- 3. Ensure View Increment RPC exists
CREATE OR REPLACE FUNCTION increment_view_count(video_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE videos
  SET view_count = view_count + amount
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Master Seed Function
CREATE OR REPLACE FUNCTION create_seed_user(
    seed_email TEXT,
    seed_username TEXT,
    seed_avatar TEXT,
    seed_bio TEXT
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if user already exists in auth.users by email
    SELECT id INTO new_user_id FROM auth.users WHERE email = seed_email;

    -- If not, create identity in auth.users
    IF new_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            seed_email,
            '$2a$10$wT8h./X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X', -- Dummy hash
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            json_build_object('username', seed_username),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO new_user_id;
    END IF;

    -- Update or Insert Profile
    INSERT INTO public.profiles (id, username, avatar_url, bio)
    VALUES (new_user_id, seed_username, seed_avatar, seed_bio)
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio;

    -- Mark as Bot
    INSERT INTO public.bots (id, username)
    VALUES (new_user_id, seed_username)
    ON CONFLICT (id) DO NOTHING;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SEED EXECUTION
DO $$
BEGIN
    -- Tech / Dev
    PERFORM create_seed_user('pixel@gl.com', 'PixelPioneer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel', 'Living in the future, one frame at a time.');
    PERFORM create_seed_user('code@gl.com', 'CodeAndCoffee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Code', 'I turn caffeine into scalable code.');
    PERFORM create_seed_user('cyber@gl.com', 'CyberSamurai', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber', 'System Architect by day, Gamer by night.');
    PERFORM create_seed_user('stack@gl.com', 'FullStack_Zach', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zach', 'JS is my second language.');
    PERFORM create_seed_user('algo@gl.com', 'AlgoRhythm', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Algo', 'Debugging the matrix.');

    -- Gaming
    PERFORM create_seed_user('retro@gl.com', 'RetroGamerJay', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Retro', '16-bit heart in a 4K world.');
    PERFORM create_seed_user('fps@gl.com', 'Headshot_Haley', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Haley', 'Clicking heads since 2012.');
    PERFORM create_seed_user('rpg@gl.com', 'QuestMaster', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quest', 'Completing side quests IRL.');
    PERFORM create_seed_user('speed@gl.com', 'SpeedRunner_X', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Speed', 'Frames serve me.');
    PERFORM create_seed_user('loot@gl.com', 'LootGoblin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Loot', 'Give me the gold.');

    -- Lifestyle / Vlog
    PERFORM create_seed_user('urban@gl.com', 'UrbanExplorer_99', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Urban', 'Finding the hidden gems in every city.');
    PERFORM create_seed_user('fit@gl.com', 'FitFocus_Maya', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya', 'Movement is medicine. Let''s get it!');
    PERFORM create_seed_user('chef@gl.com', 'ChefEco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chef', 'Sustainable eats and spicy treats.');
    PERFORM create_seed_user('van@gl.com', 'VanLife_Vic', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Van', 'Home is where you park it.');
    PERFORM create_seed_user('style@gl.com', 'StreetStyle_Zo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zo', 'Fashion is armor.');

    -- Music / Art
    PERFORM create_seed_user('lofi@gl.com', 'LunarLofi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lunar', 'Just here for the vibes and the beats.');
    PERFORM create_seed_user('art@gl.com', 'ArtVenture', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Art', 'Sketching my way through the multiverse.');
    PERFORM create_seed_user('bass@gl.com', 'BassDrop_Ben', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bass', 'Low frequencies only.');
    PERFORM create_seed_user('sketch@gl.com', 'Sketchpad_Sarah', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'Digital artist & dreamer.');
    PERFORM create_seed_user('beat@gl.com', 'BeatMaker_Pro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beat', 'Cooking up instrumentals daily.');

    -- General / Reaction
    PERFORM create_seed_user('daily@gl.com', 'DailyDose_Sam', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', 'Reacting to the best of Antigravity!');
    PERFORM create_seed_user('hype@gl.com', 'HypeBeast_Ali', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali', 'Lets GOOOO!');
    PERFORM create_seed_user('chill@gl.com', 'ChillZone_Max', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', 'Relaxing content curator.');
    PERFORM create_seed_user('meme@gl.com', 'MemeLord_2026', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meme', 'Here for the laughs.');
    PERFORM create_seed_user('news@gl.com', 'TechNews_Tina', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tina', 'Updates on everything.');

    PERFORM create_seed_user('crypto@gl.com', 'CryptoKing', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Crypto', 'To the moon 🚀');
    PERFORM create_seed_user('car@gl.com', 'GearHead_Gus', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gear', 'If it has an engine, I like it.');
    PERFORM create_seed_user('plant@gl.com', 'PlantMom_Jen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Plant', 'Photosynthesis enthusiast.');
    PERFORM create_seed_user('movie@gl.com', 'Cinephile_Ciara', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cine', 'Movies are life.');
    PERFORM create_seed_user('book@gl.com', 'BookWorm_Bob', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Book', 'Reading 50 books a year.');
    
    PERFORM create_seed_user('diy@gl.com', 'DIY_Dave', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DIY', 'Building things from scratch.');
    PERFORM create_seed_user('science@gl.com', 'Science_Steve', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Science', 'Physics is fun!');
    PERFORM create_seed_user('history@gl.com', 'HistoryBuff_Hank', 'https://api.dicebear.com/7.x/avataaars/svg?seed=History', 'Learning from the past.');
    PERFORM create_seed_user('space@gl.com', 'Astro_Anna', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Astro', 'The stars are calling.');
    PERFORM create_seed_user('pet@gl.com', 'DogLover_Dan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dog', 'Dogs > Humans.');

    PERFORM create_seed_user('photo@gl.com', 'ShutterBug_Sue', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sue', 'Capturing the moment.');
    PERFORM create_seed_user('travel@gl.com', 'Wanderlust_Will', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Will', 'Not all who wander are lost.');
    PERFORM create_seed_user('foodie@gl.com', 'Tasty_Tom', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', 'Mainly here for the food videos.');
    PERFORM create_seed_user('dance@gl.com', 'Groove_Guru', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Groove', 'Dancing through life.');
    PERFORM create_seed_user('yoga@gl.com', 'Zen_Zoe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zen', 'Breathe in, breathe out.');

    PERFORM create_seed_user('finance@gl.com', 'Invest_Izzy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Invest', 'Compound interest is magic.');
    PERFORM create_seed_user('tech@gl.com', 'Gadget_Guy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gadget', 'Reviewing the latest tech.');
    PERFORM create_seed_user('horror@gl.com', 'Spooky_Sam', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spooky', 'Scary stories only.');
    PERFORM create_seed_user('comedy@gl.com', 'Funny_Faye', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Funny', 'Making you laugh is my job.');
    PERFORM create_seed_user('edu@gl.com', 'Teacher_Tim', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tim', 'Education for everyone.');

    PERFORM create_seed_user('nature@gl.com', 'Nature_Nat', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nat', 'Preserve our planet.');
    PERFORM create_seed_user('skate@gl.com', 'Skate_Sid', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sid', 'Skate or die.');
    PERFORM create_seed_user('surf@gl.com', 'Wave_Rider', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wave', 'Surfs up!');
    PERFORM create_seed_user('climb@gl.com', 'Climb_Crazy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Climb', 'On the rocks.');
    PERFORM create_seed_user('bike@gl.com', 'Bike_Bill', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bill', 'Two wheels are enough.');
END $$;
