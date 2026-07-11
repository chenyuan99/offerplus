-- Creates the h1b_applications table expected by the statistics/filter/
-- performance migrations that follow (20240125-20240127). This table was
-- previously only ever created ad hoc by manually pasting the SQL printed
-- by h1b/upload_to_supabase.py's create_h1b_table() helper into the
-- Supabase dashboard, so it was never part of the tracked migration
-- history -- running migrations fresh (e.g. `supabase db reset`, or
-- against a new project) failed with "relation h1b_applications does not
-- exist" once it reached the first CREATE INDEX statement.
--
-- Schema matches h1b/upload_to_supabase.py exactly. Note this table is
-- later dropped by 20250509_cleanup_legacy_tables.sql, so this migration
-- only affects whether the migration chain completes -- it does not
-- change the final schema state.

CREATE TABLE IF NOT EXISTS h1b_applications (
    id BIGSERIAL PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    case_status TEXT,
    received_date TIMESTAMPTZ,
    decision_date TIMESTAMPTZ,
    visa_class TEXT,
    job_title TEXT,
    soc_code TEXT,
    soc_title TEXT,
    full_time_position TEXT,
    begin_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    employer_name TEXT,
    employer_city TEXT,
    employer_state TEXT,
    employer_postal_code TEXT,
    worksite_city TEXT,
    worksite_state TEXT,
    worksite_postal_code TEXT,
    wage_rate_of_pay_from NUMERIC,
    wage_rate_of_pay_to NUMERIC,
    wage_unit_of_pay TEXT,
    prevailing_wage NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE h1b_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON h1b_applications;
CREATE POLICY "Allow public read access" ON h1b_applications
    FOR SELECT USING (true);
