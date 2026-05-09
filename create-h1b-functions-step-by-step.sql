-- Step-by-step creation of H1B functions for h1b_applications table
-- Run each section separately to troubleshoot any issues

-- Step 1: Check if h1b_applications table exists
SELECT 'Step 1: Checking if h1b_applications table exists' as step;
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'h1b_applications'
) as table_exists;

-- Step 2: Get current table schema (for reference)
SELECT 'Step 2: Current h1b_applications schema' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'h1b_applications'
ORDER BY ordinal_position;

-- Step 3: If table doesn't exist, create a sample table structure
-- (Skip this if your table already exists)
CREATE TABLE IF NOT EXISTS h1b_applications (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(255),
    case_status VARCHAR(100),
    received_date DATE,
    decision_date DATE,
    visa_class VARCHAR(50),
    job_title VARCHAR(500),
    soc_code VARCHAR(50),
    soc_title VARCHAR(500),
    full_time_position VARCHAR(10),
    begin_date DATE,
    end_date DATE,
    employer_name VARCHAR(500),
    employer_city VARCHAR(200),
    employer_state VARCHAR(50),
    employer_postal_code VARCHAR(20),
    worksite_city VARCHAR(200),
    worksite_state VARCHAR(50),
    worksite_postal_code VARCHAR(20),
    wage_rate_of_pay_from NUMERIC(12,2),
    wage_rate_of_pay_to NUMERIC(12,2),
    wage_unit_of_pay VARCHAR(50),
    prevailing_wage NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Insert some sample data if table is empty
INSERT INTO h1b_applications (
    case_number, case_status, employer_name, job_title, 
    wage_rate_of_pay_from, received_date, worksite_state
) 
SELECT * FROM (VALUES
    ('I-200-23001-123456', 'CERTIFIED', 'Google LLC', 'Software Engineer', 150000, '2023-01-15'::DATE, 'CA'),
    ('I-200-23001-123457', 'CERTIFIED', 'Microsoft Corporation', 'Senior Software Engineer', 180000, '2023-01-20'::DATE, 'WA'),
    ('I-200-23001-123458', 'DENIED', 'Apple Inc.', 'iOS Developer', 160000, '2023-02-01'::DATE, 'CA'),
    ('I-200-23001-123459', 'CERTIFIED', 'Amazon.com Inc.', 'Cloud Engineer', 170000, '2023-02-15'::DATE, 'WA'),
    ('I-200-23001-123460', 'CERTIFIED', 'Meta Platforms Inc.', 'Data Scientist', 190000, '2023-03-01'::DATE, 'CA'),
    ('I-200-23001-123461', 'WITHDRAWN', 'Tesla Inc.', 'Software Engineer', 140000, '2023-03-15'::DATE, 'CA'),
    ('I-200-23001-123462', 'CERTIFIED', 'Netflix Inc.', 'Backend Engineer', 175000, '2023-04-01'::DATE, 'CA'),
    ('I-200-23001-123463', 'CERTIFIED', 'Uber Technologies Inc.', 'Full Stack Engineer', 165000, '2023-04-15'::DATE, 'CA'),
    ('I-200-23001-123464', 'CERTIFIED', 'Airbnb Inc.', 'Product Manager', 200000, '2023-05-01'::DATE, 'CA'),
    ('I-200-23001-123465', 'DENIED', 'Salesforce Inc.', 'DevOps Engineer', 155000, '2023-05-15'::DATE, 'CA')
) AS sample_data(case_number, case_status, employer_name, job_title, wage_rate_of_pay_from, received_date, worksite_state)
WHERE NOT EXISTS (SELECT 1 FROM h1b_applications LIMIT 1);

-- Step 5: Create basic indexes
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer_name ON h1b_applications(employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_case_status ON h1b_applications(case_status);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_title ON h1b_applications(job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_salary ON h1b_applications(wage_rate_of_pay_from);

-- Step 6: Create the main statistics function (simplified version)
CREATE OR REPLACE FUNCTION get_h1b_statistics(
  p_employer_filter TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_job_title_filter TEXT DEFAULT NULL,
  p_min_salary NUMERIC DEFAULT NULL,
  p_max_salary NUMERIC DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_apps INTEGER;
  avg_salary NUMERIC;
  median_salary NUMERIC;
  min_salary NUMERIC;
  max_salary NUMERIC;
  cert_rate NUMERIC;
  top_employers JSON;
  status_breakdown JSON;
BEGIN
  -- Build the base query with filters
  WITH filtered_data AS (
    SELECT 
      case_status,
      employer_name,
      job_title,
      wage_rate_of_pay_from,
      wage_rate_of_pay_to,
      COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) as salary
    FROM h1b_applications
    WHERE 
      (p_employer_filter IS NULL OR employer_name ILIKE '%' || p_employer_filter || '%')
      AND (p_status_filter IS NULL OR case_status = p_status_filter)
      AND (p_job_title_filter IS NULL OR job_title ILIKE '%' || p_job_title_filter || '%')
      AND (p_min_salary IS NULL OR COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) >= p_min_salary)
      AND (p_max_salary IS NULL OR COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) <= p_max_salary)
      AND (p_search_term IS NULL OR 
           employer_name ILIKE '%' || p_search_term || '%' OR
           job_title ILIKE '%' || p_search_term || '%' OR
           case_status ILIKE '%' || p_search_term || '%')
      AND COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) > 0
  )
  
  -- Calculate statistics
  SELECT 
    COUNT(*),
    ROUND(AVG(salary)::NUMERIC, 0),
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)::NUMERIC, 0),
    MIN(salary),
    MAX(salary),
    ROUND(
      (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
       NULLIF(COUNT(*), 0))::NUMERIC, 2
    )
  INTO total_apps, avg_salary, median_salary, min_salary, max_salary, cert_rate
  FROM filtered_data;
  
  -- Get top 5 employers
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'name', employer_name,
      'count', employer_count
    ) ORDER BY employer_count DESC
  )
  INTO top_employers
  FROM (
    SELECT 
      employer_name,
      COUNT(*) as employer_count
    FROM filtered_data
    WHERE employer_name IS NOT NULL AND employer_name != ''
    GROUP BY employer_name
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ) top_emp;
  
  -- Get status breakdown
  SELECT JSON_OBJECT_AGG(case_status, status_count)
  INTO status_breakdown
  FROM (
    SELECT 
      COALESCE(case_status, 'UNKNOWN') as case_status,
      COUNT(*) as status_count
    FROM filtered_data
    GROUP BY case_status
  ) status_data;
  
  -- Build final result
  result := JSON_BUILD_OBJECT(
    'totalApplications', COALESCE(total_apps, 0),
    'averageSalary', COALESCE(avg_salary, 0),
    'medianSalary', COALESCE(median_salary, 0),
    'minSalary', COALESCE(min_salary, 0),
    'maxSalary', COALESCE(max_salary, 0),
    'certificationRate', COALESCE(cert_rate, 0),
    'topEmployers', COALESCE(top_employers, '[]'::JSON),
    'statusBreakdown', COALESCE(status_breakdown, '{}'::JSON)
  );
  
  RETURN result;
END;
$$;

-- Step 7: Create simplified top employers function
CREATE OR REPLACE FUNCTION get_top_h1b_employers(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_search_term TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT JSON_BUILD_OBJECT(
    'data', JSON_AGG(
      JSON_BUILD_OBJECT(
        'name', employer_name,
        'count', application_count,
        'averageSalary', avg_salary,
        'certificationRate', cert_rate
      ) ORDER BY application_count DESC
    ),
    'totalCount', (
      SELECT COUNT(DISTINCT employer_name) 
      FROM h1b_applications 
      WHERE employer_name IS NOT NULL 
        AND employer_name != ''
        AND (p_search_term IS NULL OR employer_name ILIKE '%' || p_search_term || '%')
    )
  )
  INTO result
  FROM (
    SELECT 
      employer_name,
      COUNT(*) as application_count,
      ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0))::NUMERIC, 0) as avg_salary,
      ROUND(
        (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
         COUNT(*))::NUMERIC, 2
      ) as cert_rate
    FROM h1b_applications
    WHERE employer_name IS NOT NULL 
      AND employer_name != ''
      AND (p_search_term IS NULL OR employer_name ILIKE '%' || p_search_term || '%')
    GROUP BY employer_name
    ORDER BY COUNT(*) DESC
    LIMIT p_limit OFFSET p_offset
  ) employer_stats;
  
  RETURN result;
END;
$$;

-- Step 8: Grant permissions
GRANT EXECUTE ON FUNCTION get_h1b_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_h1b_employers TO authenticated;

-- Step 9: Test the functions
SELECT 'Step 8: Testing basic function' as step;
SELECT get_h1b_statistics();

SELECT 'Testing top employers function' as step;
SELECT get_top_h1b_employers(5, 0);