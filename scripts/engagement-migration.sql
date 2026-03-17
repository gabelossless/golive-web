-- engagement-migration.sql
-- 1. UNIFY SUBSCRIPTIONS
-- Ensure the table uses a clean composite key and has proper RLS
DROP TABLE IF EXISTS public.subscriptions CASCADE;

CREATE TABLE public.subscriptions (
    subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (subscriber_id, channel_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions are viewable by everyone
CREATE POLICY "Subscriptions are viewable by everyone" 
ON public.subscriptions FOR SELECT USING (true);

-- Users can subscribe (insert as themselves)
CREATE POLICY "Users can subscribe" 
ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

-- Users can unsubscribe (delete their own rows)
CREATE POLICY "Users can unsubscribe" 
ON public.subscriptions FOR DELETE USING (auth.uid() = subscriber_id);

-- 2. EXPAND PROFILES
-- Add banner_url, channel_color, and follower_count if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS channel_color TEXT DEFAULT '#FFB800';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count BIGINT DEFAULT 0;

-- 3. COMMENTS RESILIENCE
-- Ensure comments table exists and has proper RLS
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments viewable by everyone
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT USING (true);

-- Authenticated users can post comments
CREATE POLICY "Users can post comments" 
ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 4. ATOMIC RPC FOR FOLLOWER COUNT
-- Sync follower_count on subscribe/unsubscribe
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.channel_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.channel_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_subscription_change ON public.subscriptions;
CREATE TRIGGER on_subscription_change
AFTER INSERT OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION handle_subscription_change();

-- 5. STORAGE BUCKETS (Note: Manual step in Supabase Dashboard is preferred, 
-- but we can attempt to document the requirement here or use SQL if supported by the provider)
-- Standard Supabase Storage policy for public viewing
-- (Usually handled via Storage API or Dashboard)
