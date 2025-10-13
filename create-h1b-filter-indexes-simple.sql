-- H1B Filter Performance Indexes (Simple Version)
-- Optimized indexes for H1BFilters component functionality without pg_trgm dependency

-- Check existing indexes first
SELECT 'Checking existing indexes on h1b_applications table' as step;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'h1b_applications'
ORDER BY indexname;

-- Create composite index for multi-field searches
-- This supports searches across employer_name, job_title, and case_number
CREATE INDEX IF NOT EXISTS idx_h1b_applications_composite_search 
ON h1b_applications (employer_name, job_title, case_number);

-- Create job_title index for job title filtering
-- This supports the job title dropdown and filtering
CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_title 
ON h1b_applications (job_title);

-- Create salary range index for salary filtering
-- This supports min/max salary filtering efficiently
CREATE INDEX IF NOT EXISTS idx_h1b_applications_salary_range 
ON h1b_applications (wage_rate_of_pay_from, wage_rate_of_pay_to);

-- Create standard B-tree indexes for text search (ILIKE operations)
-- These work without pg_trgm extension and still provide good performance
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer_name_lower 
ON h1b_applications (LOWER(employer_name));

CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_title_lower 
ON h1b_applications (LOWER(job_title));

CREATE INDEX IF NOT EXISTS idx_h1b_applications_case_number_lower 
ON h1b_applications (LOWER(case_number));

-- Create index for date-based filtering (if needed for future features)
CREATE INDEX IF NOT EXISTS idx_h1b_applications_dates 
ON h1b_applications (received_date, decision_date);

-- Create partial indexes for common filter combinations
-- Index for certified applications only (most common filter)
CREATE INDEX IF NOT EXISTS idx_h1b_applications_certified 
ON h1b_applications (employer_name, wage_rate_of_pay_from) 
WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN');

-- Index for applications with salary data
CREATE INDEX IF NOT EXISTS idx_h1b_applications_with_salary 
ON h1b_applications (employer_name, job_title) 
WHERE wage_rate_of_pay_from IS NOT NULL OR wage_rate_of_pay_to IS NOT NULL;

-- Verify indexes were created
SELECT 'Verifying new indexes were created' as step;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'h1b_applications'
    AND indexname LIKE 'idx_h1b_applications_%'
ORDER BY indexname;

-- Check table statistics for index optimization
SELECT 'Table statistics for optimization' as step;
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT employer_name) as unique_employers,
    COUNT(DISTINCT job_title) as unique_job_titles,
    COUNT(DISTINCT case_status) as unique_statuses,
    COUNT(*) FILTER (WHERE wage_rate_of_pay_from IS NOT NULL) as records_with_salary_from,
    COUNT(*) FILTER (WHERE wage_rate_of_pay_to IS NOT NULL) as records_with_salary_to
FROM h1b_applications;

SELECT 'H1B filter indexes created successfully (simple version)!' as result;