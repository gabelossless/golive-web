-- Phase 6: Premium, Verified & Settings Logic
-- 1. Add subscription tier, verification, and name customization to profiles
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS channel_name TEXT;

-- 2. Add hype (likes) table for engagement
CREATE TABLE IF NOT EXISTS public.hype (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, video_id)
);

-- Enable RLS on hype
ALTER TABLE public.hype ENABLE ROW LEVEL SECURITY;

-- Policies for hype
CREATE POLICY "Public hype viewable by everyone" ON public.hype
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can hype" ON public.hype
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own hype" ON public.hype
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Update videos table to include hype_count for optimization
ALTER TABLE IF EXISTS public.videos 
ADD COLUMN IF NOT EXISTS hype_count INTEGER DEFAULT 0;

-- Function to update hype count
CREATE OR REPLACE FUNCTION public.handle_hype_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos 
        SET hype_count = hype_count + 1
        WHERE id = NEW.video_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos 
        SET hype_count = hype_count - 1
        WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for hype count
DROP TRIGGER IF EXISTS on_hype_change ON public.hype;
CREATE TRIGGER on_hype_change
AFTER INSERT OR DELETE ON public.hype
FOR EACH ROW EXECUTE FUNCTION public.handle_hype_change();
