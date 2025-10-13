-- Migration: Create H1B Filter Functions and Indexes
-- Date: 2024-01-26
-- Description: Comprehensive H1B filtering system with indexes and functions

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create composite index for multi-field searches
CREATE INDEX IF NOT EXISTS idx_h1b_applications_composite_search 
ON h1b_applications (employer_name, job_title, case_number);

-- Create job_title index for job title filtering
CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_title 
ON h1b_applications (job_title);

-- Create salary range index for salary filtering
CREATE INDEX IF NOT EXISTS idx_h1b_applications_salary_range 
ON h1b_applications (wage_rate_of_pay_from, wage_rate_of_pay_to);

-- Create standard B-tree indexes for text search (ILIKE operations)
-- These work without pg_trgm extension
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer_name_lower 
ON h1b_applications (LOWER(employer_name));

CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_title_lower 
ON h1b_applications (LOWER(job_title));

CREATE INDEX IF NOT EXISTS idx_h1b_applications_case_number_lower 
ON h1b_applications (LOWER(case_number));

-- Create index for date-based filtering
CREATE INDEX IF NOT EXISTS idx_h1b_applications_dates 
ON h1b_applications (received_date, decision_date);

-- Create partial indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_h1b_applications_certified 
ON h1b_applications (employer_name, wage_rate_of_pay_from) 
WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN');

CREATE INDEX IF NOT EXISTS idx_h1b_applications_with_salary 
ON h1b_applications (employer_name, job_title) 
WHERE wage_rate_of_pay_from IS NOT NULL OR wage_rate_of_pay_to IS NOT NULL;

-- ============================================================================
-- UNIQUE VALUE FUNCTIONS
-- ============================================================================

-- Function: Get unique employers with frequency-based ordering
CREATE OR REPLACE FUNCTION get_h1b_unique_employers(limit_count INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  -- Validate input parameters
  IF limit_count IS NULL OR limit_count <= 0 THEN
    limit_count := 50;
  END IF;
  
  IF limit_count > 1000 THEN
    limit_count := 1000;
  END IF;
  
  -- Get unique employers ordered by frequency
  SELECT JSON_AGG(employer_name ORDER BY application_count DESC)
  INTO result
  FROM (
    SELECT 
      employer_name,
      COUNT(*) as application_count
    FROM h1b_applications
    WHERE employer_name IS NOT NULL 
      AND employer_name != ''
      AND TRIM(employer_name) != ''
    GROUP BY employer_name
    ORDER BY COUNT(*) DESC, employer_name ASC
    LIMIT limit_count
  ) employer_list;
  
  RETURN COALESCE(result, '[]'::JSON);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT(
      'error', true,
      'message', 'Failed to retrieve unique employers',
      'code', 'UNIQUE_EMPLOYERS_ERROR'
    );
END;
$function$;

-- Function: Get unique case statuses
CREATE OR REPLACE FUNCTION get_h1b_unique_statuses()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT JSON_AGG(case_status ORDER BY case_status ASC)
  INTO result
  FROM (
    SELECT DISTINCT case_status
    FROM h1b_applications
    WHERE case_status IS NOT NULL 
      AND case_status != ''
      AND TRIM(case_status) != ''
    ORDER BY case_status ASC
  ) status_list;
  
  RETURN COALESCE(result, '[]'::JSON);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT(
      'error', true,
      'message', 'Failed to retrieve unique statuses',
      'code', 'UNIQUE_STATUSES_ERROR'
    );
END;
$function$;

-- Function: Get unique job titles with frequency-based ordering
CREATE OR REPLACE FUNCTION get_h1b_unique_job_titles(limit_count INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  -- Validate input parameters
  IF limit_count IS NULL OR limit_count <= 0 THEN
    limit_count := 30;
  END IF;
  
  IF limit_count > 500 THEN
    limit_count := 500;
  END IF;
  
  -- Get unique job titles ordered by frequency
  SELECT JSON_AGG(job_title ORDER BY application_count DESC)
  INTO result
  FROM (
    SELECT 
      job_title,
      COUNT(*) as application_count
    FROM h1b_applications
    WHERE job_title IS NOT NULL 
      AND job_title != ''
      AND TRIM(job_title) != ''
    GROUP BY job_title
    ORDER BY COUNT(*) DESC, job_title ASC
    LIMIT limit_count
  ) job_title_list;
  
  RETURN COALESCE(result, '[]'::JSON);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT(
      'error', true,
      'message', 'Failed to retrieve unique job titles',
      'code', 'UNIQUE_JOB_TITLES_ERROR'
    );
END;
$function$;

-- ============================================================================
-- COMPREHENSIVE FILTERING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_h1b_filtered_applications(
  filters JSON DEFAULT '{}',
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  total_count INTEGER;
  offset_count INTEGER;
  where_conditions TEXT[];
  where_clause TEXT;
  query_text TEXT;
  
  -- Filter variables
  filter_employer TEXT;
  filter_status TEXT;
  filter_job_title TEXT;
  filter_min_salary NUMERIC;
  filter_max_salary NUMERIC;
  filter_search_term TEXT;
BEGIN
  -- Input validation
  IF page_size IS NULL OR page_size <= 0 THEN
    page_size := 20;
  END IF;
  
  IF page_size > 100 THEN
    page_size := 100;
  END IF;
  
  IF page_number IS NULL OR page_number <= 0 THEN
    page_number := 1;
  END IF;
  
  -- Calculate offset
  offset_count := (page_number - 1) * page_size;
  
  -- Extract filter values from JSON
  BEGIN
    filter_employer := NULLIF(TRIM(filters->>'employer'), '');
    filter_status := NULLIF(TRIM(filters->>'status'), '');
    filter_job_title := NULLIF(TRIM(filters->>'jobTitle'), '');
    filter_search_term := NULLIF(TRIM(filters->>'searchTerm'), '');
    
    IF (filters->>'minSalary') IS NOT NULL AND (filters->>'minSalary') != '' THEN
      filter_min_salary := (filters->>'minSalary')::NUMERIC;
    END IF;
    
    IF (filters->>'maxSalary') IS NOT NULL AND (filters->>'maxSalary') != '' THEN
      filter_max_salary := (filters->>'maxSalary')::NUMERIC;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN JSON_BUILD_OBJECT(
        'error', true,
        'message', 'Invalid filter parameters',
        'code', 'INVALID_FILTERS'
      );
  END;
  
  -- Validate salary range
  IF filter_min_salary IS NOT NULL AND filter_max_salary IS NOT NULL THEN
    IF filter_min_salary > filter_max_salary THEN
      RETURN JSON_BUILD_OBJECT(
        'error', true,
        'message', 'Minimum salary cannot be greater than maximum salary',
        'code', 'INVALID_SALARY_RANGE'
      );
    END IF;
  END IF;
  
  -- Build WHERE conditions
  where_conditions := ARRAY[]::TEXT[];
  
  IF filter_employer IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'employer_name ILIKE ' || quote_literal('%' || filter_employer || '%'));
  END IF;
  
  IF filter_status IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'case_status = ' || quote_literal(filter_status));
  END IF;
  
  IF filter_job_title IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'job_title ILIKE ' || quote_literal('%' || filter_job_title || '%'));
  END IF;
  
  IF filter_min_salary IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) >= ' || filter_min_salary);
  END IF;
  
  IF filter_max_salary IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) <= ' || filter_max_salary);
  END IF;
  
  IF filter_search_term IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      '(employer_name ILIKE ' || quote_literal('%' || filter_search_term || '%') ||
      ' OR job_title ILIKE ' || quote_literal('%' || filter_search_term || '%') ||
      ' OR case_number ILIKE ' || quote_literal('%' || filter_search_term || '%') || ')');
  END IF;
  
  -- Combine WHERE conditions
  IF array_length(where_conditions, 1) > 0 THEN
    where_clause := 'WHERE ' || array_to_string(where_conditions, ' AND ');
  ELSE
    where_clause := '';
  END IF;
  
  -- Get total count
  query_text := 'SELECT COUNT(*) FROM h1b_applications ' || where_clause;
  EXECUTE query_text INTO total_count;
  
  -- Get filtered data
  query_text := '
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        ''id'', id,
        ''case_number'', case_number,
        ''case_status'', case_status,
        ''job_title'', job_title,
        ''employer_name'', employer_name,
        ''wage_rate_of_pay_from'', wage_rate_of_pay_from,
        ''wage_rate_of_pay_to'', wage_rate_of_pay_to,
        ''received_date'', received_date,
        ''decision_date'', decision_date,
        ''employer_city'', employer_city,
        ''employer_state'', employer_state,
        ''worksite_city'', worksite_city,
        ''worksite_state'', worksite_state
      ) ORDER BY id DESC
    )
    FROM (
      SELECT *
      FROM h1b_applications ' || where_clause || '
      ORDER BY id DESC
      LIMIT ' || page_size || ' OFFSET ' || offset_count || '
    ) filtered_data';
  
  EXECUTE query_text INTO result;
  
  -- Build response
  RETURN JSON_BUILD_OBJECT(
    'data', COALESCE(result, '[]'::JSON),
    'pagination', JSON_BUILD_OBJECT(
      'totalRecords', total_count,
      'totalPages', CEIL(total_count::NUMERIC / page_size),
      'currentPage', page_number,
      'pageSize', page_size,
      'hasNextPage', (page_number * page_size) < total_count,
      'hasPreviousPage', page_number > 1
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT(
      'error', true,
      'message', 'Failed to retrieve filtered applications',
      'code', 'FILTER_QUERY_ERROR',
      'details', SQLERRM
    );
END;
$function$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_h1b_unique_employers TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_unique_statuses TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_unique_job_titles TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_filtered_applications TO authenticated;

-- ============================================================================
-- ROLLBACK STATEMENTS (for reference)
-- ============================================================================

-- To rollback this migration, run:
-- DROP FUNCTION IF EXISTS get_h1b_unique_employers(INTEGER);
-- DROP FUNCTION IF EXISTS get_h1b_unique_statuses();
-- DROP FUNCTION IF EXISTS get_h1b_unique_job_titles(INTEGER);
-- DROP FUNCTION IF EXISTS get_h1b_filtered_applications(JSON, INTEGER, INTEGER);
-- DROP INDEX IF EXISTS idx_h1b_applications_composite_search;
-- DROP INDEX IF EXISTS idx_h1b_applications_job_title;
-- DROP INDEX IF EXISTS idx_h1b_applications_salary_range;
-- DROP INDEX IF EXISTS idx_h1b_applications_employer_name_lower;
-- DROP INDEX IF EXISTS idx_h1b_applications_job_title_lower;
-- DROP INDEX IF EXISTS idx_h1b_applications_case_number_lower;
-- DROP INDEX IF EXISTS idx_h1b_applications_dates;
-- DROP INDEX IF EXISTS idx_h1b_applications_certified;
-- DROP INDEX IF EXISTS idx_h1b_applications_with_salary;