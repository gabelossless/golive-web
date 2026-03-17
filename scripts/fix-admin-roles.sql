-- fix-admin-roles.sql
-- Run this if is_admin column is missing from profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Trigger security for admin routes
-- Ensure the user 'enkredible' (or your specific username) is admin
UPDATE public.profiles SET is_admin = true WHERE username = 'enkredible';
UPDATE public.profiles SET is_admin = true WHERE username = 'walt';
