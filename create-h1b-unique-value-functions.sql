-- H1B Unique Value Functions for Filter Dropdowns
-- Functions to populate dropdown options in H1BFilters component

-- Function 1: Get unique employers with frequency-based ordering
CREATE OR REPLACE FUNCTION get_h1b_unique_employers(limit_count INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  result JSON;
BEGIN
  -- Validate input parameters
  IF limit_count IS NULL OR limit_count <= 0 THEN
    limit_count := 50;
  END IF;
  
  -- Ensure limit doesn't exceed reasonable bounds
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
  
  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::JSON);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information for debugging
    RETURN JSON_BUILD_OBJECT(
      'error', true,
      'message', 'Failed to retrieve unique employers',
      'code', 'UNIQUE_EMPLOYERS_ERROR'
    );
END;
$;

-- Function 2: Get unique case statuses
CREATE OR REPLACE FUNCTION get_h1b_unique_statuses()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  result JSON;
BEGIN
  -- Get all unique case statuses
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
  
  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::JSON);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information for debugging
    RETURN JSON_BUILD_OBJECT(
      'error', true,
      'message', 'Failed to retrieve unique statuses',
      'code', 'UNIQUE_STATUSES_ERROR'
    );
END;
$;

-- Function 3: Get unique job titles with frequency-based ordering
CREATE OR REPLACE FUNCTION get_h1b_unique_job_titles(limit_count INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  result JSON;
BEGIN
  -- Validate input parameters
  IF limit_count IS NULL OR limit_count <= 0 THEN
    limit_count := 30;
  END IF;
  
  -- Ensure limit doesn't exceed reasonable bounds
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
  
  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::JSON);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information for debugging
    RETURN JSON_BUILD_OBJECT(
      'error', true,
      'message', 'Failed to retrieve unique job titles',
      'code', 'UNIQUE_JOB_TITLES_ERROR'
    );
END;
$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_h1b_unique_employers TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_unique_statuses TO authenticated;
GRANT EXECUTE ON FUNCTION get_h1b_unique_job_titles TO authenticated;

-- Test the functions
SELECT 'Testing get_h1b_unique_employers function' as test;
SELECT get_h1b_unique_employers(10);

SELECT 'Testing get_h1b_unique_statuses function' as test;
SELECT get_h1b_unique_statuses();

SELECT 'Testing get_h1b_unique_job_titles function' as test;
SELECT get_h1b_unique_job_titles(10);

SELECT 'Unique value functions created successfully!' as result;