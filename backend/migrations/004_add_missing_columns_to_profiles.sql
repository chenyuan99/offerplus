-- Migration: Add missing columns to profiles table
-- Purpose: Add email and username columns to profiles for user profile management
-- Date: 2026-05-09

BEGIN;

-- Add email column (optional, email comes from auth but useful for profile data)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add username column for user display name
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add unique constraint on username (allows NULL, won't conflict)
ALTER TABLE profiles
ADD CONSTRAINT profiles_username_unique UNIQUE NULLS NOT DISTINCT (username);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles(username);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create RLS policies: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create RLS policies: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;
