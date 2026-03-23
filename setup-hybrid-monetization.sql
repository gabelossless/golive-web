-- Phase 47: Hybrid Livestreaming & Monetization Update
-- This script expands the schema to support cost-aware routing (LiveKit/Livepeer), 
-- Gated content, Tipping, and Subscriptions.

-- 1. Update Profiles for Premium status
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_premium') THEN
        ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Update Videos/Livestreams schema for Hybrid Routing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='pipeline') THEN
        ALTER TABLE videos ADD COLUMN pipeline TEXT DEFAULT 'LIVEPEER_HLS'; -- LIVEPEER_HLS or LIVEKIT_SFU
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='viewer_count') THEN
        ALTER TABLE videos ADD COLUMN viewer_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='is_gated') THEN
        ALTER TABLE videos ADD COLUMN is_gated BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='price') THEN
        ALTER TABLE videos ADD COLUMN price NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='last_heartbeat') THEN
        ALTER TABLE videos ADD COLUMN last_heartbeat TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Transactions Table (Tips, PPV, Subscriptions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL, -- for PPV/Tips on specific stream
    type TEXT NOT NULL, -- 'tip', 'ppv', 'subscription'
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    provider TEXT, -- 'paypal', 'crypto', 'stripe'
    provider_tx_id TEXT, -- external ID
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Stream Access Table (For Gated Content)
CREATE TABLE IF NOT EXISTS stream_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- 5. Creator Subscriptions Table
CREATE TABLE IF NOT EXISTS creator_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, creator_id)
);

-- 6. Usage Metrics (For Cost Optimization & Analytics)
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    minutes_streamed INTEGER DEFAULT 0,
    viewer_minutes INTEGER DEFAULT 0,
    estimated_cost NUMERIC DEFAULT 0,
    pipeline TEXT, -- snapshot of pipeline used
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- Transactions: Users can see their own transactions; Creators can see tips/subs sent to them.
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = creator_id);

-- Stream Access: Users can see their own access records
CREATE POLICY "Users can view own stream access" ON stream_access
    FOR SELECT USING (auth.uid() = user_id);

-- Creator Subscriptions: Users see their subs; Creators see their subscribers
CREATE POLICY "Users can view own creator subscriptions" ON creator_subscriptions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = creator_id);

-- Usage Metrics: Admin only (or internal)
CREATE POLICY "Admins can view usage metrics" ON usage_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
        )
    );

-- 9. Realtime Setup
-- Enable realtime for transactions (to show tip alerts)
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE videos; -- for viewer count updates
