# Quick Setup Guide for H1B Statistics

## 🚨 Error Fix: Function Does Not Exist

The error you're seeing means the PostgreSQL functions haven't been created yet. Follow these steps to fix it:

## Step 1: Create the Functions

**Option A: Use the step-by-step script (Recommended)**

1. Open Supabase SQL Editor
2. Copy and paste the entire contents of `create-h1b-functions-step-by-step.sql`
3. Click "Run" to execute all steps at once

**Option B: Run the original migration**

1. If you have Supabase CLI installed:
   ```bash
   supabase db push
   ```

2. Or manually copy `supabase/migrations/20240125_create_h1b_statistics_functions.sql` into Supabase SQL Editor

## Step 2: Verify Functions Work

1. Copy and paste `test-h1b-functions.sql` into Supabase SQL Editor
2. Run the tests to verify everything works
3. You should see results like:

```json
{
  "totalApplications": 10,
  "averageSalary": 168500,
  "certificationRate": 70.00,
  "topEmployers": [
    {"name": "Google LLC", "count": 1},
    {"name": "Microsoft Corporation", "count": 1}
  ]
}
```

## Step 3: Test in Your React App

Once the functions are created, you can use them in your React components:

```tsx
import { H1BStatisticsComponent } from './components/h1b/H1BStatistics';

function App() {
  return (
    <div>
      <H1BStatisticsComponent enableCache={true} />
    </div>
  );
}
```

## Troubleshooting

### Issue: "Table h1b_applications does not exist"

The step-by-step script will create a sample table with test data. If you have your own H1B data, make sure your table has these columns:

- `case_number` (VARCHAR)
- `case_status` (VARCHAR) 
- `employer_name` (VARCHAR)
- `job_title` (VARCHAR)
- `wage_rate_of_pay_from` (NUMERIC)
- `wage_rate_of_pay_to` (NUMERIC)
- `received_date` (DATE)
- `worksite_state` (VARCHAR)

### Issue: "Permission denied"

Make sure you're running the SQL as a user with sufficient privileges. The functions include `SECURITY DEFINER` to run with elevated permissions.

### Issue: Functions created but React app shows errors

1. Check that your Supabase client is properly configured
2. Verify the functions exist:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE 'get_h1b%';
   ```

## Quick Test Commands

Run these in Supabase SQL Editor to verify everything works:

```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'get_h1b%';

-- Test basic function
SELECT get_h1b_statistics();

-- Test with filters
SELECT get_h1b_statistics('Google', 'CERTIFIED');
```

## Sample Data

The step-by-step script includes sample data from major tech companies:
- Google, Microsoft, Apple, Amazon, Meta
- Various job titles and salary ranges
- Different application statuses

This gives you immediate data to test with before loading your real H1B dataset.

## Next Steps

1. ✅ Create functions using `create-h1b-functions-step-by-step.sql`
2. ✅ Test functions using `test-h1b-functions.sql`
3. ✅ Use `H1BStatisticsComponent` in your React app
4. 📊 Load your real H1B data (optional)
5. 🎨 Customize the dashboard components

The system will work immediately with the sample data, then you can replace it with your actual H1B dataset when ready!