-- Phase 8: Admin Roles & Security Migration

-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Create a function to check if the current user is an admin
-- This is useful for RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Video Policies
-- Allow admins to DELETE any video
CREATE POLICY "Admins can delete all videos" 
ON public.videos 
FOR DELETE 
TO authenticated
USING (public.is_admin());

-- Allow admins to UPDATE any video (e.g. visibility or content flags)
CREATE POLICY "Admins can update all videos" 
ON public.videos 
FOR UPDATE 
TO authenticated
USING (public.is_admin());

-- 4. Update Profile Policies
-- Allow admins to see all profiles (even if private/hidden in the future)
CREATE POLICY "Admins can read all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- 5. Force schema reload
NOTIFY pgrst, 'reload schema';
