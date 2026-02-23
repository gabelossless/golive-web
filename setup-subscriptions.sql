-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (subscriber_id, channel_id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Subscriptions are viewable by everyone" 
ON subscriptions FOR SELECT 
USING (true);

CREATE POLICY "Users can subscribe" 
ON subscriptions FOR INSERT 
WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can unsubscribe" 
ON subscriptions FOR DELETE 
USING (auth.uid() = subscriber_id);
