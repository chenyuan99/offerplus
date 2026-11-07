-- Store text extracted from a user's uploaded resume by the process-resume
-- Edge Function, so it can be reused for tailored generation and fit scoring
-- without re-parsing the file on every request.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS resume_text text,
  ADD COLUMN IF NOT EXISTS resume_text_updated_at timestamptz;
