-- Simple test script for H1B PostgreSQL functions
-- Run this AFTER creating the functions with create-h1b-functions-step-by-step.sql

-- Test 1: Check if table exists and has data
SELECT 'Test 1: Table Check' as test_name;
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT employer_name) as unique_employers,
    COUNT(DISTINCT case_status) as unique_statuses
FROM h1b_applications;

-- Test 2: Basic statistics without filters
SELECT 'Test 2: Basic Statistics' as test_name;
SELECT get_h1b_statistics();

-- Test 3: Statistics with employer filter
SELECT 'Test 3: Statistics with Employer Filter' as test_name;
SELECT get_h1b_statistics('Google');

-- Test 4: Statistics with salary range
SELECT 'Test 4: Statistics with Salary Range' as test_name;
SELECT get_h1b_statistics(NULL, NULL, NULL, 100000, 200000);

-- Test 5: Top employers
SELECT 'Test 5: Top Employers' as test_name;
SELECT get_top_h1b_employers(5, 0);

-- Test 6: Check if indexes exist
SELECT 'Test 6: Index Check' as test_name;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'h1b_applications' 
ORDER BY indexname;

-- Test 7: Sample data details
SELECT 'Test 7: Sample Data Details' as test_name;
SELECT 
    employer_name,
    job_title,
    case_status,
    wage_rate_of_pay_from,
    worksite_state
FROM h1b_applications 
ORDER BY wage_rate_of_pay_from DESC
LIMIT 5;