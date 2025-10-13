-- H1B Performance Optimization Migration
-- Optimized indexes and functions for maximum query performance

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_h1b_applications_employer_name;
DROP INDEX IF EXISTS idx_h1b_applications_case_status;
DROP INDEX IF EXISTS idx_h1b_applications_job_title;
DROP INDEX IF EXISTS idx_h1b_applications_salary;

-- Create optimized B-tree indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_employer_name_optimized 
ON h1b_applications (employer_name) 
WHERE employer_name IS NOT NULL AND employer_name != '';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_case_status_optimized 
ON h1b_applications (case_status) 
WHERE case_status IS NOT NULL AND case_status != '';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_job_title_optimized 
ON h1b_applications (job_title) 
WHERE job_title IS NOT NULL AND job_title != '';

-- Salary range index for efficient range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_salary_range_optimized 
ON h1b_applications (wage_rate_of_pay_from) 
WHERE wage_rate_of_pay_from IS NOT NULL AND wage_rate_of_pay_from > 0;

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_composite_filters 
ON h1b_applications (case_status, employer_name, wage_rate_of_pay_from) 
WHERE case_status IS NOT NULL AND employer_name IS NOT NULL;

-- Index for ordering (most common sort)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_id_desc 
ON h1b_applications (id DESC);

-- Partial index for certified applications (most queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_certified_apps 
ON h1b_applications (employer_name, wage_rate_of_pay_from, received_date) 
WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN');

-- Text search optimization (if pg_trgm is available)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_employer_trgm 
-- ON h1b_applications USING gin (employer_name gin_trgm_ops);

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h1b_job_title_trgm 
-- ON h1b_applications USING gin (job_title gin_trgm_ops);

-- ============================================================================
-- OPTIMIZED RPC FUNCTIONS
-- ============================================================================

-- Fast top employers function with caching-friendly structure
CREATE OR REPLACE FUNCTION get_top_employers_fast(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(name TEXT, count BIGINT, avg_salary NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    employer_name as name,
    COUNT(*) as count,
    ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0))::NUMERIC, 0) as avg_salary
  FROM h1b_applications
  WHERE employer_name IS NOT NULL 
    AND employer_name != ''
    AND TRIM(employer_name) != ''
  GROUP BY employer_name
  ORDER BY COUNT(*) DESC, employer_name ASC
  LIMIT limit_count;
$$;

-- Fast case status function
CREATE OR REPLACE FUNCTION get_case_statuses_fast()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    case_status as status,
    COUNT(*) as count
  FROM h1b_applications
  WHERE case_status IS NOT NULL 
    AND case_status != ''
    AND TRIM(case_status) != ''
  GROUP BY case_status
  ORDER BY case_status ASC;
$$;

-- Fast job titles function
CREATE OR REPLACE FUNCTION get_job_titles_fast(limit_count INTEGER DEFAULT 30)
RETURNS TABLE(title TEXT, count BIGINT, avg_salary NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    job_title as title,
    COUNT(*) as count,
    ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0))::NUMERIC, 0) as avg_salary
  FROM h1b_applications
  WHERE job_title IS NOT NULL 
    AND job_title != ''
    AND TRIM(job_title) != ''
  GROUP BY job_title
  ORDER BY COUNT(*) DESC, job_title ASC
  LIMIT limit_count;
$$;

-- Lightweight statistics function
CREATE OR REPLACE FUNCTION get_h1b_stats_lightweight(filters JSONB DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_count BIGINT;
  certified_count BIGINT;
  avg_salary NUMERIC;
  where_clause TEXT := '';
  query_text TEXT;
BEGIN
  -- Build WHERE clause from filters (simplified for performance)
  IF (filters->>'status') IS NOT NULL AND (filters->>'status') != '' THEN
    where_clause := where_clause || ' AND case_status = ' || quote_literal(filters->>'status');
  END IF;
  
  IF (filters->>'employer') IS NOT NULL AND (filters->>'employer') != '' THEN
    where_clause := where_clause || ' AND employer_name ILIKE ' || quote_literal('%' || (filters->>'employer') || '%');
  END IF;

  -- Get basic counts
  query_text := 'SELECT COUNT(*) FROM h1b_applications WHERE 1=1' || where_clause;
  EXECUTE query_text INTO total_count;

  -- Get certified count
  query_text := 'SELECT COUNT(*) FROM h1b_applications WHERE case_status IN (''CERTIFIED'', ''CERTIFIED-WITHDRAWN'')' || where_clause;
  EXECUTE query_text INTO certified_count;

  -- Get average salary
  query_text := 'SELECT ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0))::NUMERIC, 0) FROM h1b_applications WHERE COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) > 0' || where_clause;
  EXECUTE query_text INTO avg_salary;

  -- Build result
  result := jsonb_build_object(
    'totalApplications', COALESCE(total_count, 0),
    'averageSalary', COALESCE(avg_salary, 0),
    'certificationRate', CASE 
      WHEN total_count > 0 THEN ROUND((certified_count * 100.0 / total_count)::NUMERIC, 1)
      ELSE 0 
    END,
    'topEmployers', '[]'::jsonb,
    'statusBreakdown', '{}'::jsonb
  );

  RETURN result;
END;
$$;

-- Optimized count function for pagination
CREATE OR REPLACE FUNCTION get_h1b_filtered_count(filters JSONB DEFAULT '{}')
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  total_count BIGINT;
  where_conditions TEXT[] := ARRAY[]::TEXT[];
  where_clause TEXT := '';
  query_text TEXT;
BEGIN
  -- Build WHERE conditions array
  IF (filters->>'employer') IS NOT NULL AND TRIM(filters->>'employer') != '' THEN
    where_conditions := array_append(where_conditions, 
      'employer_name ILIKE ' || quote_literal('%' || TRIM(filters->>'employer') || '%'));
  END IF;

  IF (filters->>'status') IS NOT NULL AND TRIM(filters->>'status') != '' THEN
    where_conditions := array_append(where_conditions, 
      'case_status = ' || quote_literal(TRIM(filters->>'status')));
  END IF;

  IF (filters->>'jobTitle') IS NOT NULL AND TRIM(filters->>'jobTitle') != '' THEN
    where_conditions := array_append(where_conditions, 
      'job_title ILIKE ' || quote_literal('%' || TRIM(filters->>'jobTitle') || '%'));
  END IF;

  IF (filters->>'minSalary') IS NOT NULL AND (filters->>'minSalary')::NUMERIC > 0 THEN
    where_conditions := array_append(where_conditions, 
      'wage_rate_of_pay_from >= ' || (filters->>'minSalary')::NUMERIC);
  END IF;

  IF (filters->>'maxSalary') IS NOT NULL AND (filters->>'maxSalary')::NUMERIC > 0 THEN
    where_conditions := array_append(where_conditions, 
      'wage_rate_of_pay_from <= ' || (filters->>'maxSalary')::NUMERIC);
  END IF;

  IF (filters->>'searchTerm') IS NOT NULL AND TRIM(filters->>'searchTerm') != '' THEN
    where_conditions := array_append(where_conditions, 
      '(employer_name ILIKE ' || quote_literal('%' || TRIM(filters->>'searchTerm') || '%') ||
      ' OR job_title ILIKE ' || quote_literal('%' || TRIM(filters->>'searchTerm') || '%') || ')');
  END IF;

  -- Combine WHERE conditions
  IF array_length(where_conditions, 1) > 0 THEN
    where_clause := 'WHERE ' || array_to_string(where_conditions, ' AND ');
  END IF;

  -- Execute count query
  query_text := 'SELECT COUNT(*) FROM h1b_applications ' || where_clause;
  EXECUTE query_text INTO total_count;

  RETURN COALESCE(total_count, 0);
END;
$$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_top_employers_fast TO authenticated;
GRANT EXECUTE ON FUNCTION get_case_statuses_fast TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_titles_fast TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_stats_lightweight TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_filtered_count TO authenticated;

-- ============================================================================
-- PERFORMANCE ANALYSIS
-- ============================================================================

-- Analyze tables for better query planning
ANALYZE h1b_applications;

-- Update table statistics
SELECT 'Performance optimization completed' as status;
SELECT 'Indexes created: ' || COUNT(*) as index_count 
FROM pg_indexes 
WHERE tablename = 'h1b_applications' 
  AND indexname LIKE 'idx_h1b_%_optimized';

-- Show table size and index sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename = 'h1b_applications';

-- ============================================================================
-- ROLLBACK STATEMENTS (for reference)
-- ============================================================================

-- To rollback this migration:
-- DROP FUNCTION IF EXISTS get_top_employers_fast(INTEGER);
-- DROP FUNCTION IF EXISTS get_case_statuses_fast();
-- DROP FUNCTION IF EXISTS get_job_titles_fast(INTEGER);
-- DROP FUNCTION IF EXISTS get_h1b_stats_lightweight(JSONB);
-- DROP FUNCTION IF EXISTS get_h1b_filtered_count(JSONB);
-- DROP INDEX IF EXISTS idx_h1b_employer_name_optimized;
-- DROP INDEX IF EXISTS idx_h1b_case_status_optimized;
-- DROP INDEX IF EXISTS idx_h1b_job_title_optimized;
-- DROP INDEX IF EXISTS idx_h1b_salary_range_optimized;
-- DROP INDEX IF EXISTS idx_h1b_composite_filters;
-- DROP INDEX IF EXISTS idx_h1b_id_desc;
-- DROP INDEX IF EXISTS idx_h1b_certified_apps;