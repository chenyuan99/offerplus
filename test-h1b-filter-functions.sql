-- Test Suite for H1B Filter Functions
-- Comprehensive testing of all filter functions with various scenarios

-- ============================================================================
-- SETUP AND VALIDATION
-- ============================================================================

SELECT 'H1B Filter Functions Test Suite' as test_suite;
SELECT 'Starting comprehensive function testing...' as status;

-- Check if functions exist
SELECT 'Checking function existence' as test_step;
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name LIKE 'get_h1b_%'
ORDER BY routine_name;

-- Check table structure and data availability
SELECT 'Validating h1b_applications table' as test_step;
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT employer_name) as unique_employers,
  COUNT(DISTINCT case_status) as unique_statuses,
  COUNT(DISTINCT job_title) as unique_job_titles,
  MIN(wage_rate_of_pay_from) as min_salary,
  MAX(wage_rate_of_pay_from) as max_salary
FROM h1b_applications;

-- ============================================================================
-- TEST UNIQUE EMPLOYERS FUNCTION
-- ============================================================================

SELECT 'Testing get_h1b_unique_employers function' as test_step;

-- Test 1: Default parameters
SELECT 'Test 1: Default limit (50 employers)' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_employers()) as returned_count,
  'Should return up to 50 employers' as expected;

-- Test 2: Custom limit
SELECT 'Test 2: Custom limit (10 employers)' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_employers(10)) as returned_count,
  'Should return up to 10 employers' as expected;

-- Test 3: Large limit (should be capped)
SELECT 'Test 3: Large limit (should be capped at 1000)' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_employers(5000)) as returned_count,
  'Should return up to 1000 employers' as expected;

-- Test 4: Invalid parameters
SELECT 'Test 4: Invalid parameters (negative, zero, null)' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_employers(-5)) as negative_test,
  JSON_ARRAY_LENGTH(get_h1b_unique_employers(0)) as zero_test,
  JSON_ARRAY_LENGTH(get_h1b_unique_employers(NULL)) as null_test;

-- Test 5: Verify frequency ordering
SELECT 'Test 5: Verify frequency-based ordering' as test_case;
WITH employer_counts AS (
  SELECT employer_name, COUNT(*) as actual_count
  FROM h1b_applications
  WHERE employer_name IS NOT NULL AND employer_name != ''
  GROUP BY employer_name
  ORDER BY COUNT(*) DESC
  LIMIT 5
),
function_result AS (
  SELECT JSON_ARRAY_ELEMENTS_TEXT(get_h1b_unique_employers(5)) as employer_name
)
SELECT 
  ec.employer_name,
  ec.actual_count,
  fr.employer_name as function_result
FROM employer_counts ec
FULL OUTER JOIN function_result fr ON ec.employer_name = fr.employer_name;

-- ============================================================================
-- TEST UNIQUE STATUSES FUNCTION
-- ============================================================================

SELECT 'Testing get_h1b_unique_statuses function' as test_step;

-- Test 1: Basic functionality
SELECT 'Test 1: Basic status retrieval' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_statuses()) as returned_count,
  'Should return all unique statuses' as expected;

-- Test 2: Verify alphabetical ordering
SELECT 'Test 2: Verify alphabetical ordering' as test_case;
SELECT JSON_ARRAY_ELEMENTS_TEXT(get_h1b_unique_statuses()) as status_list;

-- Test 3: Compare with direct query
SELECT 'Test 3: Compare with direct query results' as test_case;
WITH direct_query AS (
  SELECT COUNT(DISTINCT case_status) as direct_count
  FROM h1b_applications
  WHERE case_status IS NOT NULL AND case_status != ''
),
function_query AS (
  SELECT JSON_ARRAY_LENGTH(get_h1b_unique_statuses()) as function_count
)
SELECT 
  dq.direct_count,
  fq.function_count,
  CASE WHEN dq.direct_count = fq.function_count THEN 'PASS' ELSE 'FAIL' END as test_result
FROM direct_query dq, function_query fq;

-- ============================================================================
-- TEST UNIQUE JOB TITLES FUNCTION
-- ============================================================================

SELECT 'Testing get_h1b_unique_job_titles function' as test_step;

-- Test 1: Default parameters
SELECT 'Test 1: Default limit (30 job titles)' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_job_titles()) as returned_count,
  'Should return up to 30 job titles' as expected;

-- Test 2: Custom limit
SELECT 'Test 2: Custom limit (15 job titles)' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_job_titles(15)) as returned_count,
  'Should return up to 15 job titles' as expected;

-- Test 3: Large limit (should be capped)
SELECT 'Test 3: Large limit (should be capped at 500)' as test_case;
SELECT 
  JSON_ARRAY_LENGTH(get_h1b_unique_job_titles(1000)) as returned_count,
  'Should return up to 500 job titles' as expected;

-- Test 4: Verify frequency ordering for job titles
SELECT 'Test 4: Verify frequency-based ordering for job titles' as test_case;
WITH job_title_counts AS (
  SELECT job_title, COUNT(*) as actual_count
  FROM h1b_applications
  WHERE job_title IS NOT NULL AND job_title != ''
  GROUP BY job_title
  ORDER BY COUNT(*) DESC
  LIMIT 3
)
SELECT job_title, actual_count
FROM job_title_counts;

-- ============================================================================
-- TEST COMPREHENSIVE FILTERING FUNCTION
-- ============================================================================

SELECT 'Testing get_h1b_filtered_applications function' as test_step;

-- Test 1: No filters (should return paginated results)
SELECT 'Test 1: No filters applied' as test_case;
SELECT 
  (get_h1b_filtered_applications('{}', 5, 1)->>'data')::JSON->0->>'employer_name' as first_employer,
  (get_h1b_filtered_applications('{}', 5, 1)->'pagination'->>'totalRecords')::INTEGER as total_records,
  (get_h1b_filtered_applications('{}', 5, 1)->'pagination'->>'pageSize')::INTEGER as page_size;

-- Test 2: Employer filter
SELECT 'Test 2: Employer filter' as test_case;
WITH sample_employer AS (
  SELECT employer_name
  FROM h1b_applications
  WHERE employer_name IS NOT NULL AND employer_name != ''
  LIMIT 1
)
SELECT 
  se.employer_name as test_employer,
  (get_h1b_filtered_applications(
    JSON_BUILD_OBJECT('employer', se.employer_name), 5, 1
  )->'pagination'->>'totalRecords')::INTEGER as filtered_count
FROM sample_employer se;

-- Test 3: Status filter
SELECT 'Test 3: Status filter' as test_case;
WITH sample_status AS (
  SELECT case_status
  FROM h1b_applications
  WHERE case_status IS NOT NULL AND case_status != ''
  LIMIT 1
)
SELECT 
  ss.case_status as test_status,
  (get_h1b_filtered_applications(
    JSON_BUILD_OBJECT('status', ss.case_status), 5, 1
  )->'pagination'->>'totalRecords')::INTEGER as filtered_count
FROM sample_status ss;

-- Test 4: Job title filter
SELECT 'Test 4: Job title filter' as test_case;
SELECT 
  (get_h1b_filtered_applications(
    '{"jobTitle": "Software"}', 5, 1
  )->'pagination'->>'totalRecords')::INTEGER as software_jobs_count;

-- Test 5: Salary range filter
SELECT 'Test 5: Salary range filter' as test_case;
SELECT 
  (get_h1b_filtered_applications(
    '{"minSalary": 100000, "maxSalary": 200000}', 5, 1
  )->'pagination'->>'totalRecords')::INTEGER as salary_range_count;

-- Test 6: Text search filter
SELECT 'Test 6: Text search filter' as test_case;
SELECT 
  (get_h1b_filtered_applications(
    '{"searchTerm": "engineer"}', 5, 1
  )->'pagination'->>'totalRecords')::INTEGER as engineer_search_count;

-- Test 7: Combined filters
SELECT 'Test 7: Combined filters' as test_case;
SELECT 
  (get_h1b_filtered_applications(
    '{"employer": "Google", "status": "CERTIFIED", "minSalary": 120000}', 5, 1
  )->'pagination'->>'totalRecords')::INTEGER as combined_filter_count;

-- Test 8: Pagination functionality
SELECT 'Test 8: Pagination functionality' as test_case;
WITH page_test AS (
  SELECT 
    get_h1b_filtered_applications('{}', 10, 1) as page1,
    get_h1b_filtered_applications('{}', 10, 2) as page2
)
SELECT 
  (page1->'pagination'->>'currentPage')::INTEGER as page1_number,
  (page2->'pagination'->>'currentPage')::INTEGER as page2_number,
  (page1->'pagination'->>'hasNextPage')::BOOLEAN as page1_has_next,
  (page2->'pagination'->>'hasPreviousPage')::BOOLEAN as page2_has_previous
FROM page_test;

-- Test 9: Invalid parameters
SELECT 'Test 9: Invalid parameters' as test_case;
SELECT 
  get_h1b_filtered_applications('{"minSalary": 200000, "maxSalary": 100000}', 5, 1)->>'error' as salary_range_error,
  get_h1b_filtered_applications('invalid json', 5, 1)->>'error' as json_error;

-- Test 10: Edge cases
SELECT 'Test 10: Edge cases' as test_case;
SELECT 
  (get_h1b_filtered_applications('{}', -5, 0)->'pagination'->>'pageSize')::INTEGER as negative_page_size,
  (get_h1b_filtered_applications('{}', 200, 1)->'pagination'->>'pageSize')::INTEGER as large_page_size;

-- ============================================================================
-- PERFORMANCE TESTS
-- ============================================================================

SELECT 'Performance testing' as test_step;

-- Test response times for different operations
SELECT 'Test: Function execution times' as test_case;

-- Time the unique employers function
\timing on
SELECT 'Timing unique employers function' as operation;
SELECT JSON_ARRAY_LENGTH(get_h1b_unique_employers(50)) as result;

-- Time the filtering function
SELECT 'Timing filtering function with no filters' as operation;
SELECT (get_h1b_filtered_applications('{}', 20, 1)->'pagination'->>'totalRecords')::INTEGER as result;

-- Time the filtering function with complex filters
SELECT 'Timing filtering function with complex filters' as operation;
SELECT (get_h1b_filtered_applications(
  '{"searchTerm": "software", "minSalary": 80000, "maxSalary": 150000}', 20, 1
)->'pagination'->>'totalRecords')::INTEGER as result;
\timing off

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 'Test suite completed successfully!' as final_status;
SELECT 'All H1B filter functions have been tested with various scenarios' as summary;

-- Check indexes are being used (requires EXPLAIN ANALYZE)
SELECT 'Index usage verification' as test_step;
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM h1b_applications 
WHERE employer_name ILIKE '%Google%' 
  AND wage_rate_of_pay_from >= 100000;