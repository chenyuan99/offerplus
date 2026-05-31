-- Migration: Create resumes table
-- Purpose: Store metadata about uploaded resume files
-- Note: This is separate from the Supabase Storage bucket which stores the actual files
-- Date: 2026-05-09

BEGIN;

-- Create resumes table for resume metadata
CREATE TABLE IF NOT EXISTS resumes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File information
  file_path TEXT NOT NULL,          -- Path in storage bucket (e.g., user-id/timestamp-random.pdf)
  file_name TEXT NOT NULL,          -- Original filename
  file_size BIGINT NOT NULL,        -- File size in bytes
  mime_type TEXT NOT NULL,          -- MIME type (e.g., application/pdf)
  public_url TEXT NOT NULL,         -- Public URL to download file

  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resumes_user_id
  ON resumes(user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_uploaded
  ON resumes(user_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_resumes_created_at
  ON resumes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own resumes
CREATE POLICY "Users can view their own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own resumes
CREATE POLICY "Users can insert their own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own resumes
CREATE POLICY "Users can update their own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own resumes
CREATE POLICY "Users can delete their own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
