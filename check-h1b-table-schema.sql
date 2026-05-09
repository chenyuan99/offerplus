-- Check the existing h1b_applications table schema
-- Run this first to understand the current table structure

-- Step 1: Check if h1b_applications table exists
SELECT 'Checking if h1b_applications table exists' as step;
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'h1b_applications'
) as table_exists;

-- Step 2: Get table schema
SELECT 'Getting h1b_applications table schema' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'h1b_applications'
ORDER BY ordinal_position;

-- Step 3: Check sample data
SELECT 'Sample data from h1b_applications' as step;
SELECT * FROM h1b_applications LIMIT 5;

-- Step 4: Check data counts and basic stats
SELECT 'Basic statistics from h1b_applications' as step;
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT employer_name) as unique_employers,
    COUNT(DISTINCT case_status) as unique_statuses,
    MIN(wage_rate_of_pay_from) as min_salary,
    MAX(wage_rate_of_pay_from) as max_salary,
    AVG(wage_rate_of_pay_from) as avg_salary
FROM h1b_applications 
WHERE wage_rate_of_pay_from IS NOT NULL AND wage_rate_of_pay_from > 0;

-- Step 5: Check existing indexes
SELECT 'Existing indexes on h1b_applications' as step;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'h1b_applications' 
ORDER BY indexname;