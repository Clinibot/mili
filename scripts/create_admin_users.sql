-- ================================================================
-- CREATE ADMIN USERS IN SUPABASE AUTH
-- Execute this in Supabase SQL Editor
-- ================================================================

-- Insert admin users into auth.users table
-- Note: These passwords are hashed with bcrypt
-- Password: mili@mili.com (both users use their email as password)

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'mili@mili.com',
  crypt('mili@mili.com', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sonia@sonia.com',
  crypt('sonia@sonia.com', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT id, email, email_confirmed_at FROM auth.users WHERE email IN ('mili@mili.com', 'sonia@sonia.com');
