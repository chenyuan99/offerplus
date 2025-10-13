-- Migration: Create H1B Statistics Functions for h1b_applications table
-- This migration creates PostgreSQL functions to calculate H1B statistics efficiently

-- Create or replace function to get comprehensive H1B statistics
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
      AND COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) > 0 -- Exclude zero salaries
  )
  
  -- Calculate total applications
  SELECT COUNT(*) INTO total_apps FROM filtered_data;
  
  -- Calculate average salary
  SELECT ROUND(AVG(salary)::NUMERIC, 0) INTO avg_salary FROM filtered_data WHERE salary > 0;
  
  -- Calculate median salary
  SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)::NUMERIC, 0) 
  INTO median_salary FROM filtered_data WHERE salary > 0;
  
  -- Calculate min salary
  SELECT MIN(salary) INTO min_salary FROM filtered_data WHERE salary > 0;
  
  -- Calculate max salary
  SELECT MAX(salary) INTO max_salary FROM filtered_data WHERE salary > 0;
  
  -- Calculate certification rate
  SELECT 
    ROUND(
      (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
       NULLIF(COUNT(*), 0))::NUMERIC, 2
    ) 
  INTO cert_rate FROM filtered_data;
  
  -- Get top 10 employers
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
    LIMIT 10
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

-- Create function to get top employers with pagination
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
      ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0)), 0) as avg_salary,
      ROUND(
        (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
         COUNT(*)), 2
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

-- Create function to get salary statistics by job title
CREATE OR REPLACE FUNCTION get_h1b_salary_by_job_title(
  p_job_title TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'jobTitle', job_title,
      'count', job_count,
      'averageSalary', avg_salary,
      'medianSalary', median_salary,
      'minSalary', min_salary,
      'maxSalary', max_salary
    ) ORDER BY job_count DESC
  )
  INTO result
  FROM (
    SELECT 
      job_title,
      COUNT(*) as job_count,
      ROUND(AVG(salary), 0) as avg_salary,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary), 0) as median_salary,
      MIN(salary) as min_salary,
      MAX(salary) as max_salary
    FROM (
      SELECT 
        job_title,
        COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) as salary
      FROM h1b_applications
      WHERE job_title IS NOT NULL 
        AND job_title != ''
        AND COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0) > 0
        AND (p_job_title IS NULL OR job_title ILIKE '%' || p_job_title || '%')
    ) salary_data
    GROUP BY job_title
    HAVING COUNT(*) >= 5  -- Only include job titles with at least 5 records
    ORDER BY COUNT(*) DESC
    LIMIT p_limit
  ) job_stats;
  
  RETURN result;
END;
$$;

-- Create function to get H1B trends over time
CREATE OR REPLACE FUNCTION get_h1b_trends(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_group_by TEXT DEFAULT 'month' -- 'month', 'quarter', 'year'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  date_format TEXT;
BEGIN
  -- Set date format based on grouping
  CASE p_group_by
    WHEN 'year' THEN date_format := 'YYYY';
    WHEN 'quarter' THEN date_format := 'YYYY-Q';
    ELSE date_format := 'YYYY-MM';
  END CASE;
  
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'period', period,
      'totalApplications', total_apps,
      'certifiedApplications', certified_apps,
      'certificationRate', cert_rate,
      'averageSalary', avg_salary
    ) ORDER BY period
  )
  INTO result
  FROM (
    SELECT 
      TO_CHAR(received_date::DATE, date_format) as period,
      COUNT(*) as total_apps,
      COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) as certified_apps,
      ROUND(
        (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
         COUNT(*)), 2
      ) as cert_rate,
      ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0)), 0) as avg_salary
    FROM h1b_applications
    WHERE received_date IS NOT NULL
      AND (p_start_date IS NULL OR received_date::DATE >= p_start_date)
      AND (p_end_date IS NULL OR received_date::DATE <= p_end_date)
    GROUP BY TO_CHAR(received_date::DATE, date_format)
    ORDER BY TO_CHAR(received_date::DATE, date_format)
  ) trend_data;
  
  RETURN result;
END;
$$;

-- Create function to get H1B statistics by state
CREATE OR REPLACE FUNCTION get_h1b_statistics_by_state()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'state', state,
      'totalApplications', total_apps,
      'averageSalary', avg_salary,
      'certificationRate', cert_rate,
      'topEmployer', top_employer
    ) ORDER BY total_apps DESC
  )
  INTO result
  FROM (
    SELECT 
      COALESCE(worksite_state, employer_state, 'UNKNOWN') as state,
      COUNT(*) as total_apps,
      ROUND(AVG(COALESCE(wage_rate_of_pay_from, wage_rate_of_pay_to, 0)), 0) as avg_salary,
      ROUND(
        (COUNT(*) FILTER (WHERE case_status IN ('CERTIFIED', 'CERTIFIED-WITHDRAWN')) * 100.0 / 
         COUNT(*)), 2
      ) as cert_rate,
      (
        SELECT employer_name 
        FROM h1b_applications h2 
        WHERE COALESCE(h2.worksite_state, h2.employer_state) = COALESCE(h1.worksite_state, h1.employer_state)
        GROUP BY employer_name 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
      ) as top_employer
    FROM h1b_applications h1
    WHERE COALESCE(worksite_state, employer_state) IS NOT NULL
    GROUP BY COALESCE(worksite_state, employer_state)
    HAVING COUNT(*) >= 10  -- Only include states with at least 10 applications
    ORDER BY COUNT(*) DESC
  ) state_stats;
  
  RETURN result;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer_name ON h1b_applications(employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_case_status ON h1b_applications(case_status);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_title ON h1b_applications(job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_salary ON h1b_applications(wage_rate_of_pay_from, wage_rate_of_pay_to);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_received_date ON h1b_applications(received_date);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_worksite_state ON h1b_applications(worksite_state);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer_state ON h1b_applications(employer_state);

-- Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_h1b_applications_employer_status ON h1b_applications(employer_name, case_status);
CREATE INDEX IF NOT EXISTS idx_h1b_applications_job_salary ON h1b_applications(job_title, wage_rate_of_pay_from);

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_h1b_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_h1b_employers TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_salary_by_job_title TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_statistics_by_state TO authenticated;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Enable RLS on h1b_applications table if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'h1b_applications' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE h1b_applications ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Create policy to allow read access to all authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'h1b_applications' AND policyname = 'h1b_applications_read_policy'
  ) THEN
    CREATE POLICY h1b_applications_read_policy ON h1b_applications
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;