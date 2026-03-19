-- Add wallet_address to profiles for crypto tipping
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create an index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);
