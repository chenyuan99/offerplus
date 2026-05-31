-- ============================================================
-- Fix RLS policies
-- ============================================================

-- 1. Drop the two overly-permissive policies on applications
--    that allow any user to read/write any row.
DROP POLICY IF EXISTS "Allow authenticated users" ON public.applications;
DROP POLICY IF EXISTS "Allow public read"         ON public.applications;

-- 2. Enable RLS on tables that were fully exposed
ALTER TABLE public.jobgpt_jobposting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks_company    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks_job        ENABLE ROW LEVEL SECURITY;

-- 3. Add read-only public policies for the job-board reference tables.
--    These tables have no user_id; they are shared public data.

CREATE POLICY "Public can view active job postings"
  ON public.jobgpt_jobposting
  FOR SELECT
  USING (is_visible = true AND active = true);

CREATE POLICY "Public can view companies"
  ON public.tracks_company
  FOR SELECT
  USING (true);

CREATE POLICY "Public can view track jobs"
  ON public.tracks_job
  FOR SELECT
  USING (true);

-- 4. Tighten applications SELECT policies to require authentication.
--    The existing per-user policies use the public role, which also
--    covers anonymous sessions. Restrict them to authenticated users.
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;

CREATE POLICY "Users can view their own applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Tighten write policies to authenticated role as well
DROP POLICY IF EXISTS "Users can create their own applications" ON public.applications;
CREATE POLICY "Users can create their own applications"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
CREATE POLICY "Users can update their own applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own applications" ON public.applications;
CREATE POLICY "Users can delete their own applications"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
