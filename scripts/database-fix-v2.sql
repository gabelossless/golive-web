-- Migration to fix subscriptions and add hype engine support
-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (subscriber_id, channel_id)
);

-- 2. Add hype_count to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS hype_count INTEGER DEFAULT 0;

-- 3. Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Subscriptions Policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Subscriptions are viewable by everyone'
    ) THEN
        CREATE POLICY "Subscriptions are viewable by everyone" ON subscriptions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can subscribe'
    ) THEN
        CREATE POLICY "Users can subscribe" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can unsubscribe'
    ) THEN
        CREATE POLICY "Users can unsubscribe" ON subscriptions FOR DELETE USING (auth.uid() = subscriber_id);
    END IF;
END $$;

-- 5. RPC for Hype Increment (Safe to call from client)
CREATE OR REPLACE FUNCTION increment_hype_count(video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos
    SET hype_count = hype_count + 1
    WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
