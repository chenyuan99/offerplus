-- H1B Comprehensive Filtering Function
-- Advanced filtering with pagination for H1BFilters component

CREATE OR REPLACE FUNCTION get_h1b_filtered_applications(
  filters JSON DEFAULT '{}',
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
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
    page_size := 100; -- Limit page size for performance
  END IF;
  
  IF page_number IS NULL OR page_number <= 0 THEN
    page_number := 1;
  END IF;
  
  -- Calculate offset
  offset_count := (page_number - 1) * page_size;
  
  -- Extract filter values from JSON (with null checks)
  BEGIN
    filter_employer := NULLIF(TRIM(filters->>'employer'), '');
    filter_status := NULLIF(TRIM(filters->>'status'), '');
    filter_job_title := NULLIF(TRIM(filters->>'jobTitle'), '');
    filter_search_term := NULLIF(TRIM(filters->>'searchTerm'), '');
    
    -- Handle numeric filters
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
  
  -- Build WHERE conditions array
  where_conditions := ARRAY[]::TEXT[];
  
  -- Employer filter (partial match)
  IF filter_employer IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'employer_name ILIKE ' || quote_literal('%' || filter_employer || '%'));
  END IF;
  
  -- Status filter (exact match)
  IF filter_status IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'case_status = ' || quote_literal(filter_status));
  END IF;
  
  -- Job title filter (partial match)
  IF filter_job_title IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'job_title ILIKE ' || quote_literal('%' || filter_job_title || '%'));
  END IF;
  
  -- Salary filters
  IF filter_min_salary IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) >= ' || filter_min_salary);
  END IF;
  
  IF filter_max_salary IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) <= ' || filter_max_salary);
  END IF;
  
  -- Text search across multiple fields
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
  
  -- Get total count for pagination
  query_text := 'SELECT COUNT(*) FROM h1b_applications ' || where_clause;
  EXECUTE query_text INTO total_count;
  
  -- Get filtered data with pagination
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
  
  -- Build final response with pagination metadata
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
$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_h1b_filtered_applications TO authenticated;

-- Test the function with various filter combinations
SELECT 'Testing get_h1b_filtered_applications - no filters' as test;
SELECT get_h1b_filtered_applications('{}', 5, 1);

SELECT 'Testing get_h1b_filtered_applications - employer filter' as test;
SELECT get_h1b_filtered_applications('{"employer": "Google"}', 5, 1);

SELECT 'Testing get_h1b_filtered_applications - salary range' as test;
SELECT get_h1b_filtered_applications('{"minSalary": 100000, "maxSalary": 200000}', 5, 1);

SELECT 'Testing get_h1b_filtered_applications - text search' as test;
SELECT get_h1b_filtered_applications('{"searchTerm": "software"}', 5, 1);

SELECT 'Filtering function created successfully!' as result;