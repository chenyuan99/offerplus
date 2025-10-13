# Updated Setup Instructions for H1B Applications Table

## 🎯 **Corrected for `h1b_applications` table**

All SQL files have been updated to use the correct table name `h1b_applications` instead of `h1b_records`.

## 📋 **Step-by-Step Setup**

### Step 1: Check Your Current Table Schema

First, run this to understand your current table structure:

```sql
-- Copy and paste check-h1b-table-schema.sql into Supabase SQL Editor
```

This will show you:
- ✅ If `h1b_applications` table exists
- 📊 Current column structure
- 📈 Sample data and basic statistics
- 🔍 Existing indexes

### Step 2: Create the Functions

**Option A: Use the updated step-by-step script (Recommended)**

```sql
-- Copy and paste create-h1b-functions-step-by-step.sql into Supabase SQL Editor
```

**Option B: Use the updated migration**

```sql
-- Copy and paste supabase/migrations/20240125_create_h1b_statistics_functions_updated.sql
```

### Step 3: Test the Functions

```sql
-- Copy and paste test-h1b-functions.sql into Supabase SQL Editor
```

## 🔧 **What's Been Updated**

### Files Updated for `h1b_applications`:

1. ✅ **`create-h1b-functions-step-by-step.sql`** - Main setup script
2. ✅ **`test-h1b-functions.sql`** - Test script
3. ✅ **`supabase/migrations/20240125_create_h1b_statistics_functions_updated.sql`** - Migration file
4. ✅ **`check-h1b-table-schema.sql`** - New schema checker
5. ✅ **Documentation files** - Updated references

### Functions Created:

- `get_h1b_statistics()` - Main statistics with filtering
- `get_top_h1b_employers()` - Top employers with pagination
- `get_h1b_salary_by_job_title()` - Salary analysis by job title
- `get_h1b_trends()` - Time-based trends
- `get_h1b_statistics_by_state()` - Geographic statistics

### Indexes Created:

- `idx_h1b_applications_employer_name`
- `idx_h1b_applications_case_status`
- `idx_h1b_applications_job_title`
- `idx_h1b_applications_salary`
- And more for optimal performance

## 🧪 **Expected Test Results**

After running the setup, you should see results like:

```json
{
  "totalApplications": 1234,
  "averageSalary": 125000,
  "certificationRate": 85.5,
  "topEmployers": [
    {"name": "Google LLC", "count": 45},
    {"name": "Microsoft Corporation", "count": 38}
  ]
}
```

## 🚀 **Using in React**

Once functions are created, use them in your React app:

```tsx
import { H1BStatisticsComponent } from './components/h1b/H1BStatistics';

function App() {
  return (
    <div>
      <H1BStatisticsComponent 
        filters={{ employer: 'Google' }}
        enableCache={true} 
      />
    </div>
  );
}
```

## 🔍 **Troubleshooting**

### If you get "function does not exist":
1. Make sure you ran the setup script completely
2. Check function exists: `SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE 'get_h1b%';`

### If you get "table does not exist":
1. Verify table name: `SELECT tablename FROM pg_tables WHERE tablename LIKE '%h1b%';`
2. Make sure you're using `h1b_applications` not `h1b_records`

### If performance is slow:
1. Check indexes were created: `SELECT indexname FROM pg_indexes WHERE tablename = 'h1b_applications';`
2. Run `ANALYZE h1b_applications;` to update table statistics

## 📊 **Next Steps**

1. ✅ Run `check-h1b-table-schema.sql` to see your current setup
2. ✅ Run `create-h1b-functions-step-by-step.sql` to create functions
3. ✅ Run `test-h1b-functions.sql` to verify everything works
4. 🎨 Use the React components in your app
5. 📈 Enjoy fast H1B statistics powered by PostgreSQL!

The system is now correctly configured for your `h1b_applications` table! 🎉