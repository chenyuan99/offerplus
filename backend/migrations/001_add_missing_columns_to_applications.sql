-- Migration: Add missing columns to applications table
-- Purpose: Add user_id, company_name, and notes columns to support multi-user applications
-- Date: 2026-05-09

BEGIN;

-- Add user_id column to associate applications with users (nullable for existing rows)
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add company_name column to store company name separately from link
ALTER TABLE applications
ADD COLUMN company_name TEXT;

-- Add notes column for user annotations
ALTER TABLE applications
ADD COLUMN notes TEXT;

-- Create index on user_id for faster queries
CREATE INDEX idx_applications_user_id ON applications(user_id);

-- Create index on user_id and date_applied for common queries
CREATE INDEX idx_applications_user_date ON applications(user_id, date_applied);

-- Enable Row Level Security for applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can view their own applications
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can create applications
CREATE POLICY "Users can create their own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can update their own applications
CREATE POLICY "Users can update their own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can delete their own applications
CREATE POLICY "Users can delete their own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
