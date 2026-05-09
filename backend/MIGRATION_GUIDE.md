# Database Migration Guide

Complete guide for applying database schema migrations to Supabase.

---

## Overview

This directory contains SQL migrations to fix the database schema and support the frontend application. The migrations address critical issues identified in the API audit.

**Status**: 🔴 **BLOCKING** - These migrations must be applied before the application can function.

---

## Migrations

### Migration 001: Add Missing Columns to Applications Table

**File**: `001_add_missing_columns_to_applications.sql`

**Changes**:
- Adds `user_id` column (UUID, required, foreign key to auth.users)
- Adds `company_name` column (TEXT, optional)
- Adds `notes` column (TEXT, optional)
- Creates indexes on `user_id` for performance
- Enables Row Level Security (RLS) policies

**Why needed**:
- Frontend code expects these columns
- `user_id` is required to associate applications with users
- Without this, multi-user support is broken

**Risk**: Low - Adds new columns only, doesn't modify existing data

**Time**: ~5 minutes

---

### Migration 002: Create H1B Applications Table

**File**: `002_create_h1b_applications_table.sql`

**Changes**:
- Creates new `h1b_applications` table
- Columns: id, job_id, employer_name, job_title, job_location, wage_offered, wage_unit, wage_source, approved_date, status, created_at, updated_at
- Creates indexes for performance
- Enables RLS with public read access (H1B data is public)

**Why needed**:
- Frontend code queries this table in h1bStatisticsService and h1bNativeFilterService
- Table currently doesn't exist, causing crashes

**Risk**: Low - Creates new table, doesn't affect existing tables

**Time**: ~5 minutes

---

### Migration 003: Create Resumes Table

**File**: `003_create_resumes_table.sql`

**Changes**:
- Creates new `resumes` table for resume metadata
- Columns: id, user_id, file_path, file_name, file_size, mime_type, public_url, uploaded_at, created_at, updated_at
- Creates indexes on user_id for performance
- Enables RLS - users can only access their own resumes

**Important**: This is different from the Supabase Storage bucket. This table stores metadata about resume files.

**Why needed**:
- Frontend code queries this table in jobgptService and other resume management code
- Currently doesn't exist, causing crashes

**Risk**: Low - Creates new table, doesn't affect existing tables

**Time**: ~5 minutes

---

### Migration 004: Add Missing Columns to Profiles Table

**File**: `004_add_missing_columns_to_profiles.sql`

**Changes**:
- Adds `email` column (TEXT, optional)
- Adds `username` column (TEXT, optional, unique)
- Creates index on username
- Ensures RLS is enabled

**Why needed**:
- Frontend code expects these columns
- Email can come from auth, but useful to store in profile
- Username is used for display names

**Risk**: Low - Adds new columns only

**Time**: ~5 minutes

---

## How to Apply Migrations

### Option 1: Supabase Dashboard (Easiest for beginners)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query
5. Copy contents of `001_add_missing_columns_to_applications.sql`
6. Run the query
7. Repeat for migrations 002, 003, 004

### Option 2: Supabase CLI (Recommended for development)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref lwexhbimtxpndhsidogl

# Apply migrations
supabase migration up

# Or manually apply each migration:
psql "postgresql://..." -f 001_add_missing_columns_to_applications.sql
psql "postgresql://..." -f 002_create_h1b_applications_table.sql
psql "postgresql://..." -f 003_create_resumes_table.sql
psql "postgresql://..." -f 004_add_missing_columns_to_profiles.sql
```

### Option 3: Direct SQL (Production)

For production deployments, use Supabase's SQL Editor or a migration tool like Flyway/Liquibase to track applied migrations.

---

## Applying Migrations - Step by Step

### Step 1: Backup Your Data (CRITICAL!)

```bash
# Export database backup
pg_dump "postgresql://user:password@host:port/database" > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Supabase dashboard: Database > Backups > Create backup
```

### Step 2: Handle Legacy Data (If Needed)

If you have existing application records without a user_id and want to clean them up:

```sql
-- Delete orphaned applications (no user_id)
DELETE FROM applications WHERE user_id IS NULL;
```

This is optional—the migration allows NULL user_id for legacy data, but new applications must have a user_id.

### Step 3: Apply Migration 001

**In Supabase SQL Editor**:

```sql
-- Copy entire contents of 001_add_missing_columns_to_applications.sql
-- Paste and run
```

**Verify**:
```sql
-- Check that columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'applications';

-- Should include: user_id, company_name, notes
```

### Step 4: Apply Migration 002

**In Supabase SQL Editor**:

```sql
-- Copy entire contents of 002_create_h1b_applications_table.sql
-- Paste and run
```

**Verify**:
```sql
-- Check that table was created
SELECT * FROM h1b_applications LIMIT 1;
-- Should return empty table (success)
```

### Step 5: Apply Migration 003

**In Supabase SQL Editor**:

```sql
-- Copy entire contents of 003_create_resumes_table.sql
-- Paste and run
```

**Verify**:
```sql
-- Check that table was created
SELECT * FROM resumes LIMIT 1;
-- Should return empty table (success)
```

### Step 6: Apply Migration 004

**In Supabase SQL Editor**:

```sql
-- Copy entire contents of 004_add_missing_columns_to_profiles.sql
-- Paste and run
```

**Verify**:
```sql
-- Check that columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Should include: email, username
```

---

## Verification Checklist

After applying all migrations, verify everything is correct:

```sql
-- 1. Check applications table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY column_name;
-- Should have: user_id, company_name, notes

-- 2. Check h1b_applications table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'h1b_applications';
-- Should return: 1

-- 3. Check resumes table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'resumes';
-- Should return: 1

-- 4. Check profiles table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY column_name;
-- Should have: email, username

-- 5. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('applications', 'profiles', 'resumes', 'h1b_applications');
-- All should show: true
```

---

## Rollback Procedure

If something goes wrong, you can rollback:

```sql
-- Rollback Migration 004 (profiles changes)
ALTER TABLE profiles DROP COLUMN IF EXISTS username;
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Rollback Migration 003 (resumes table)
DROP TABLE IF EXISTS resumes CASCADE;

-- Rollback Migration 002 (h1b_applications table)
DROP TABLE IF EXISTS h1b_applications CASCADE;

-- Rollback Migration 001 (applications changes)
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON applications;
DROP INDEX IF EXISTS idx_applications_user_date;
DROP INDEX IF EXISTS idx_applications_user_id;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_user_id_not_null;
ALTER TABLE applications DROP COLUMN IF EXISTS notes;
ALTER TABLE applications DROP COLUMN IF EXISTS company_name;
ALTER TABLE applications DROP COLUMN IF EXISTS user_id;
```

---

## Impact on Frontend Code

After migrations are applied:

### ✓ Now Works

- Creating applications with user_id
- Storing company_name in applications
- Storing notes in applications
- H1B statistics page (has data)
- H1B filtering (has data)
- Resume metadata queries
- User profile management

### ⚠️ Requires Frontend Updates

```typescript
// Update types to include new columns
interface Application {
  id: number;
  user_id: string;        // Now available
  company_name: string;   // Now available
  notes?: string;         // Now available
  // ... other fields
}

// Update services to use new fields
const app = await applicationsService.create({
  user_id: currentUser.id,     // Can now use
  company_name: 'Google',      // Can now use
  notes: 'Applied via referral', // Can now use
  // ... other fields
});
```

---

## Timeline

**Estimated total time**: 25-35 minutes

| Step | Time | Task |
|------|------|------|
| 1 | 5 min | Backup database |
| 2 | 2 min | (Optional) Clean up legacy data |
| 3 | 5 min | Apply migration 001 |
| 4 | 5 min | Apply migration 002 |
| 5 | 5 min | Apply migration 003 |
| 6 | 5 min | Apply migration 004 |
| 7 | 5 min | Verify all changes |

---

## Troubleshooting

### "Column already exists"
The column was already added. This is safe to ignore. The migration includes `IF NOT EXISTS` clauses to handle this.

### "Table already exists"
The table already exists. This is safe to ignore. The migration includes `IF NOT EXISTS` clauses.

### "Permission denied"
You need superuser or owner privileges. Log in with the superuser account.

### "Foreign key constraint failed"
The user_id references don't exist. This is expected if the table is being created first time. This is not a problem.

### "RLS policy already exists"
The policy was already created. Drop the old one first:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

---

## Testing After Migration

### 1. Test Application Creation

```typescript
// In frontend: Create an application with user_id
const app = await applicationsService.create({
  user_id: currentUser.id,
  job_title: 'Software Engineer',
  company_name: 'Google',  // NEW: Should save
  company_link: 'https://google.com',
  job_link: 'https://jobs.google.com/123',
  status: 'applied',
  date_applied: new Date().toISOString(),
  notes: 'Referred by John'  // NEW: Should save
});

// Verify in database:
SELECT * FROM applications WHERE id = app.id;
// Should show: user_id, company_name, notes filled in
```

### 2. Test H1B Statistics

```typescript
// Navigate to H1B statistics page
// Should load without error
// Should display statistics if data exists
```

### 3. Test Resume Upload

```typescript
// Upload a resume
// Check both storage and database
const profile = await profileService.getProfile();
// Should have resume metadata in resumes table
```

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Verify all migrations were applied in order
3. Check logs in Supabase Dashboard > Logs
4. Review the migration files for any syntax errors

---

## Next Steps

After migrations are applied:

1. ✅ Database schema is fixed
2. ⏳ Update frontend code to use new columns (see "Impact on Frontend Code")
3. ⏳ Run tests to verify functionality
4. ⏳ Update TypeScript types if needed
5. ⏳ Deploy frontend changes
