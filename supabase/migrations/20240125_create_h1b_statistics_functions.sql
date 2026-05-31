-- Migration: Create H1B Statistics Functions (original draft)
-- NOTE: This file originally targeted the h1b_records table which was later
-- renamed to h1b_applications. All function definitions are superseded by
-- 20240125_create_h1b_statistics_functions_updated.sql which uses the correct
-- table name. Function bodies are omitted here to avoid duplication.

-- Create indexes and RLS only if the legacy h1b_records table exists.
-- On fresh deployments this block is skipped entirely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'h1b_records'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_h1b_records_employer_name ON h1b_records(employer_name);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_case_status ON h1b_records(case_status);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_job_title ON h1b_records(job_title);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_salary ON h1b_records(wage_rate_of_pay_from, wage_rate_of_pay_to);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_received_date ON h1b_records(received_date);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_worksite_state ON h1b_records(worksite_state);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_employer_state ON h1b_records(employer_state);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_employer_status ON h1b_records(employer_name, case_status);
    CREATE INDEX IF NOT EXISTS idx_h1b_records_job_salary ON h1b_records(job_title, wage_rate_of_pay_from);

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'h1b_records' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
      ALTER TABLE h1b_records ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'h1b_records' AND policyname = 'h1b_records_read_policy'
    ) THEN
      CREATE POLICY h1b_records_read_policy ON h1b_records
        FOR SELECT TO authenticated
        USING (true);
    END IF;
  END IF;
END $$;
