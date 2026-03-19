-- Promote test user to admin for verification
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin_bot@test.com';
