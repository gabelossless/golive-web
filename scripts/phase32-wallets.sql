/**
 * SQL Migration: Phase 32 — Multi-Chain Wallet Columns
 * 
 * Run this in your Supabase SQL editor:
 * https://supabase.com/dashboard/project/puhrqtwakabyvagnvcch/sql
 */

-- 1. Add Solana wallet address column to profiles
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS solana_wallet_address TEXT;

-- 2. Add Base (EVM) wallet address column if not present
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- 3. Create an index for wallet lookups (e.g. to check if wallet is already registered)
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address
    ON profiles (wallet_address)
    WHERE wallet_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_solana_wallet
    ON profiles (solana_wallet_address)
    WHERE solana_wallet_address IS NOT NULL;

-- 4. Tip transactions log (for creator revenue dashboard in Phase 33)
CREATE TABLE IF NOT EXISTS tip_transactions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chain           TEXT        NOT NULL CHECK (chain IN ('base', 'solana')),
    asset           TEXT        NOT NULL CHECK (asset IN ('native', 'usdc')),
    amount_raw      TEXT        NOT NULL,   -- raw amount string (avoid float)
    tx_hash         TEXT        UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Anyone can insert a tip transaction, only creator can read their own
ALTER TABLE tip_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_tip" ON tip_transactions;
CREATE POLICY "insert_tip"
    ON tip_transactions FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "read_own_tips" ON tip_transactions;
CREATE POLICY "read_own_tips"
    ON tip_transactions FOR SELECT
    USING (creator_user_id = auth.uid() OR fan_user_id = auth.uid());
