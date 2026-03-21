-- FIX: Add missing columns for Studio Settings and Wallet Integration
-- 1. UI Preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS channel_color TEXT DEFAULT '#FFB800';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Wallet Backfill
-- Ensure these columns exist (Phase 37 should have them, but let's be safe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS solana_wallet_address TEXT;

-- 3. Refresh Schema Cache
-- This is handled by Supabase automatically, but these columns are NOW available to the SDK.
