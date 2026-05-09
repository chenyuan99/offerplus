-- Migration: Create h1b_applications table
-- Purpose: Store H1B visa application data for statistics and filtering
-- Date: 2026-05-09

BEGIN;

-- Create h1b_applications table for H1B visa data
CREATE TABLE IF NOT EXISTS h1b_applications (
  -- Primary key
  id BIGINT PRIMARY KEY,

  -- Basic information
  job_id TEXT,
  employer_name TEXT,
  job_title TEXT,
  job_location TEXT,

  -- Wage information
  wage_offered TEXT,
  wage_unit TEXT,
  wage_source TEXT,

  -- Status information
  approved_date DATE,
  status TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer
  ON h1b_applications(employer_name);

CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_title
  ON h1b_applications(job_title);

CREATE INDEX IF NOT EXISTS idx_h1b_applications_location
  ON h1b_applications(job_location);

CREATE INDEX IF NOT EXISTS idx_h1b_applications_status
  ON h1b_applications(status);

CREATE INDEX IF NOT EXISTS idx_h1b_applications_approved_date
  ON h1b_applications(approved_date);

-- Enable Row Level Security (for future: restrict to logged-in users)
ALTER TABLE h1b_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view H1B data (it's public information)
CREATE POLICY "Anyone can view h1b applications"
  ON h1b_applications FOR SELECT
  USING (true);

COMMIT;
