-- Simple H1B Statistics Functions - Easy to understand and debug
-- This version avoids complex CTEs and dynamic SQL

-- Check if table exists first
SELECT 'Checking h1b_applications table' as step;
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT employer_name) as unique_employers,
    COUNT(DISTINCT case_status) as unique_statuses
FROM h1b_applications;

-- Create simple statistics function without filters first
CREATE OR REPLACE FUNCTION get_h1b_basic_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_apps INTEGER;
  avg_salary NUMERIC;
  cert_rate NUMERIC;
  top_employers JSON;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO total_apps 
  FROM h1b_applications 
  WHERE COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) > 0;
  
  -- Get average salary
  SELECT ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0))::NUMERIC, 0) 
  INTO avg_salary
  FROM h1b_applications 
  WHERE COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) > 0;
  
  -- Get certification rate
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
     NULLIF(COUNT(*), 0))::NUMERIC, 2
  )
  INTO cert_rate
  FROM h1b_applications;
  
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
    FROM h1b_applications
    WHERE employer_name IS NOT NULL AND employer_name != ''
    GROUP BY employer_name
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ) top_emp;
  
  -- Build result
  result := JSON_BUILD_OBJECT(
    'totalApplications', COALESCE(total_apps, 0),
    'averageSalary', COALESCE(avg_salary, 0),
    'certificationRate', COALESCE(cert_rate, 0),
    'topEmployers', COALESCE(top_employers, '[]'::JSON)
  );
  
  RETURN result;
END;
$$;

-- Create function with employer filter
CREATE OR REPLACE FUNCTION get_h1b_stats_by_employer(p_employer TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_apps INTEGER;
  avg_salary NUMERIC;
  cert_rate NUMERIC;
BEGIN
  -- Get stats for specific employer
  SELECT 
    COUNT(*),
    ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0))::NUMERIC, 0),
    ROUND(
      (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
       NULLIF(COUNT(*), 0))::NUMERIC, 2
    )
  INTO total_apps, avg_salary, cert_rate
  FROM h1b_applications
  WHERE employer_name ILIKE '%' || p_employer || '%'
    AND COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) > 0;
  
  -- Build result
  result := JSON_BUILD_OBJECT(
    'employer', p_employer,
    'totalApplications', COALESCE(total_apps, 0),
    'averageSalary', COALESCE(avg_salary, 0),
    'certificationRate', COALESCE(cert_rate, 0)
  );
  
  RETURN result;
END;
$$;

-- Create top employers function
CREATE OR REPLACE FUNCTION get_top_employers(p_limit INTEGER DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'name', employer_name,
      'count', application_count,
      'averageSalary', avg_salary,
      'certificationRate', cert_rate
    ) ORDER BY application_count DESC
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
    WHERE employer_name IS NOT NULL AND employer_name != ''
    GROUP BY employer_name
    ORDER BY COUNT(*) DESC
    LIMIT p_limit
  ) employer_stats;
  
  RETURN result;
END;
$$;

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer_name ON h1b_applications(employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_case_status ON h1b_applications(case_status);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_salary ON h1b_applications(wage_rate_of_pay_from);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_h1b_basic_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_stats_by_employer TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_employers TO authenticated;

-- Test the functions
SELECT 'Testing basic stats function' as test;
SELECT get_h1b_basic_stats();

SELECT 'Testing employer-specific stats' as test;
SELECT get_h1b_stats_by_employer('Google');

SELECT 'Testing top employers' as test;
SELECT get_top_employers(5);