-- ====================================================================
-- SQL Script to Seed Default Users directly into Supabase Auth
-- Run this in the Supabase Dashboard SQL Editor.
-- This bypasses the sign-up rate limits and confirmation emails.
-- ====================================================================

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper to generate cryptographically secure hash matching Supabase Auth (bcrypt)
-- Password for all accounts is: password123
-- You can change this below if needed.

-- 1. Admin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'admin@crionvrots.com', crypt('admin123', gen_salt('bf', 10)), now(), 
  '{"provider":"email","providers":["email"]}', '{"name":"Admin","role":"Admin"}', now(), now(), 
  '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@crionvrots.com');

-- 2. Manager
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'manager@crionvrots.com', crypt('manager123', gen_salt('bf', 10)), now(), 
  '{"provider":"email","providers":["email"]}', '{"name":"Manager","role":"Manager"}', now(), now(), 
  '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@crionvrots.com');

-- 3. Team Member
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'member@crionvrots.com', crypt('member123', gen_salt('bf', 10)), now(), 
  '{"provider":"email","providers":["email"]}', '{"name":"Team Member","role":"Team Member"}', now(), now(), 
  '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'member@crionvrots.com');

-- 4. Stakeholder
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'stakeholder@crionvrots.com', crypt('stakeholder123', gen_salt('bf', 10)), now(), 
  '{"provider":"email","providers":["email"]}', '{"name":"Stakeholder","role":"Stakeholder"}', now(), now(), 
  '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'stakeholder@crionvrots.com');

