-- Migration to create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
    subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (subscriber_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
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
