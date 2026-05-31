# Comprehensive API Audit Report

**Date**: 2026-05-09  
**Status**: 🔴 **CRITICAL ISSUES - MULTIPLE MISSING TABLES**

---

## Executive Summary

The application has **significant architectural inconsistencies** across three levels:
1. **Database Schema** - Missing required tables and columns
2. **REST API** - 21 tables exposed, but not all are used or needed
3. **Frontend Code** - Uses tables that don't exist in the database

This creates a **completely broken application** with multiple failure points.

---

## Part 1: Database Analysis

### ✅ Tables That Exist in Supabase (Verified)

**Core Application Tables:**
```
✓ applications        - Job applications (8 fields, missing user_id, company_name, notes)
✓ profiles            - User profiles (7 fields, missing email, username)
✓ tracks_company      - Company data
✓ jobgpt_jobposting   - Job postings
```

**Django Legacy Tables** (not used by frontend):
```
- accounts_userprofile
- auth_group, auth_group_permissions, auth_permission
- auth_user, auth_user_groups, auth_user_user_permissions
- social_auth_* (OAuth tables)
- tracks_job, tracks_job_applicants, tracks_emailthread, tracks_emailmessage
- tracks_applicationrecord
```

### ❌ Tables That DON'T Exist (But frontend tries to use)

**Critical Missing Tables:**
```
❌ resumes             - Frontend queries this table in 7+ places
                        API error: "Could not find the table 'public.resumes'"
                        
❌ h1b_applications    - Frontend queries this in h1bNativeFilterService
                        API error: "Could not find the table 'public.h1b_applications'"
```

### Summary of Missing Table Columns

| Table | Missing Columns | Impact |
|-------|-----------------|--------|
| applications | user_id, company_name, notes | Code tries to insert/read these; operations fail |
| profiles | email, username | Code displays undefined values |
| ❌ resumes | N/A (entire table missing) | 7+ code locations fail |
| ❌ h1b_applications | N/A (entire table missing) | H1B statistics page fails |

---

## Part 2: REST API Analysis

### OpenAPI Spec (21 Endpoints Exposed)

Supabase auto-generates REST API for all tables:

```
POST   /rest/v1/{table}           - Create
GET    /rest/v1/{table}           - List/Query
GET    /rest/v1/{table}/:id       - Get by ID
PATCH  /rest/v1/{table}/:id       - Update
DELETE /rest/v1/{table}/:id       - Delete
```

**21 tables = 105 auto-generated REST endpoints**

### API Usage by Frontend

| Endpoint | Used | Status |
|----------|------|--------|
| GET /applications | ✓ Yes | Via SDK |
| GET /profiles | ✓ Yes | Via SDK |
| GET /resumes | ✗ Attempted | ❌ TABLE DOESN'T EXIST |
| GET /h1b_applications | ✗ Attempted | ❌ TABLE DOESN'T EXIST |
| GET /tracks_company | ✓ Yes | Via SDK |
| GET /jobgpt_jobposting | ✗ No | Exposed but unused |
| Other 17 tables | ✗ No | Mostly Django legacy |

### API Configuration Issues

**File**: `frontend/.env.example`

```env
NEXT_PUBLIC_API_URL=https://api.offerplus.io    # ⚠️ DEFINED BUT NEVER USED
NEXT_PUBLIC_SUPABASE_URL=...                    # ✓ Actually used
```

**Status**: API_URL environment variable is defined but not referenced anywhere in the code. It's dead code.

---

## Part 3: Frontend Code Audit

### Current API Usage Patterns

**Pattern 1: Supabase SDK (Modern) ✓**
```typescript
// Used in: applications, profiles, tracks_company
const { data } = await supabase
  .from('applications')
  .select('*')
  .order('date_applied', { ascending: false });
```

**Pattern 2: REST API via Axios (Legacy) ⚠️**
```typescript
// File: src/pages/Internship.tsx
const response = await axios.get(`/api/internships?page=${currentPage}`);
// ⚠️ This endpoint doesn't exist in OpenAPI spec!
```

**Pattern 3: Non-existent Tables ❌**
```typescript
// File: src/services/api.ts (lines 238-240)
const { data } = await supabase.storage.from('resumes').upload(...)  // OK
await authService.updateProfile({ resume: result.filePath })        // OK

// File: src/services/h1bNativeFilterService.ts
const query = supabase.from('h1b_applications')                      // ❌ FAILS!

// File: src/services/h1bStatisticsService.ts
const { data } = await supabase.from('h1b_applications')             // ❌ FAILS!
```

### All Supabase SDK Calls

```
✓ supabase.from('applications')      - 5 places
✓ supabase.from('profiles')          - 2 places
✓ supabase.from('tracks_company')    - 1 place
❌ supabase.from('h1b_applications')  - 2 places (FAILS)
❌ supabase.from('resumes')           - 7 places (FAILS)
✓ supabase.storage.from('resumes')   - 3 places (storage, OK)
```

### Storage vs Table Confusion

**Important**: There are TWO separate "resumes":
1. **Storage Bucket** (`supabase.storage.from('resumes')`) ✓ EXISTS - Works fine
2. **Database Table** (`supabase.from('resumes')`) ❌ DOESN'T EXIST - Fails

Code mixes both approaches, causing confusion.

---

## Part 4: Broken Features

### 🔴 Complete Failures

| Feature | Location | Error |
|---------|----------|-------|
| H1B Statistics | `src/services/h1bStatisticsService.ts` | Table doesn't exist |
| H1B Filtering | `src/services/h1bNativeFilterService.ts` | Table doesn't exist |
| Internships Page | `src/pages/Internship.tsx` | Wrong API endpoint |

### 🟡 Partial Failures

| Feature | Issue | Impact |
|---------|-------|--------|
| Applications | Missing user_id, company_name, notes columns | Data loss, missing associations |
| Profiles | Missing email, username columns | Displays undefined values |
| Resume Tracking | Using storage + table inconsistently | Metadata lost |

### ✓ Working Features

| Feature | Status |
|---------|--------|
| Authentication | ✓ Works (uses Supabase Auth) |
| Companies Page | ✓ Works (queries tracks_company) |
| Create Application | ⚠️ Partially (user_id fails silently) |
| Dashboard | ⚠️ Partially (company_name missing) |

---

## Part 5: Architecture Issues

### 1. **Mixed API Strategies**

```
What exists:         What frontend uses:      Result:
├─ REST API (105)    ├─ SDK (modern) ✓      ├─ Mostly good
├─ (auto-generated)  ├─ Axios (legacy) ⚠️   ├─ Broken endpoints
└─ (Supabase)        └─ Non-existent tables ├─ Critical failures
                       ❌                    └─ App is broken
```

### 2. **Table Proliferation**

**Exposed** (21 tables):
- 4 core application tables
- 17 Django/legacy tables (mostly unused)

**Should expose** (4 tables):
- applications
- profiles
- tracks_company
- jobgpt_jobposting

**Efficiency**: 76% of exposed tables are unused.

### 3. **Storage vs Database Confusion**

```
Supabase has TWO "resumes":
1. Storage Bucket: supabase.storage.from('resumes')  ✓ EXISTS
2. DB Table:       supabase.from('resumes')          ❌ DOESN'T EXIST

Frontend uses BOTH inconsistently:
- Upload: supabase.storage.from('resumes')          ✓ Works
- Metadata: supabase.from('resumes')                ❌ Fails
- Types: expects both to work
```

### 4. **Type-Reality Mismatch**

```typescript
// Type definition expects:
interface Application {
  id: number
  user_id: string      // ❌ Not in DB
  company_name: string // ❌ Not in DB
  notes?: string       // ❌ Not in DB
  // ...
}

// Reality (actual DB fields):
{
  id: 1,
  job_title: "...",
  company_link: "...",  // Not company_name!
  status: "...",
  // ... no user_id, company_name, or notes
}

// Result: Runtime errors and silent failures
```

---

## Part 6: Critical Findings

### 🔴 Tier 1 - Application Breaking

1. **H1B tables don't exist**
   - h1b_applications table referenced in code but doesn't exist
   - h1bStatisticsService will crash
   - h1bNativeFilterService will crash
   - Impact: H1B statistics page completely broken

2. **Resumes table doesn't exist (database)**
   - Frontend tries to query `supabase.from('resumes')`
   - This is different from storage bucket
   - jobgptService will crash
   - Impact: Resume metadata operations fail

3. **Missing column: user_id in applications**
   - Code inserts user_id but column doesn't exist
   - Either causes DB error or silent failure
   - Can't associate applications with users
   - Impact: Multi-user support broken

### 🟡 Tier 2 - Data Loss

4. **Missing columns: company_name, notes in applications**
   - Code uses these fields but columns don't exist
   - Data is lost or causes errors
   - company_link exists but code uses company_name
   - Impact: Missing data in applications

5. **Missing columns: email, username in profiles**
   - Code expects these but columns don't exist
   - Workaround: Gets from Auth instead (partial OK)
   - Impact: Limited impact due to Auth workaround

### ⚠️ Tier 3 - Architecture Issues

6. **Dead API configuration**
   - NEXT_PUBLIC_API_URL defined but never used
   - Legacy Axios endpoint referenced but doesn't match OpenAPI
   - Impact: Confusing configuration, unused code

7. **21 exposed tables (only 4 needed)**
   - Django legacy tables cluttering the API
   - Increases surface area
   - Makes API harder to understand
   - Impact: Maintenance burden

---

## Part 7: Root Cause Analysis

### Why This Happened

**Timeline of misalignment:**

```
1. Initial setup:    Django backend created with Django tables
2. Migration:        Switched to Supabase (but didn't clean up)
3. Frontend code:    Written expecting specific schema
4. Database:         Created without matching schema to code
5. Result:           3 different versions of truth exist:
                     - Frontend types (expected schema)
                     - OpenAPI spec (what Supabase exposes)
                     - Actual database (what really exists)
```

**Each is different**:
- Frontend expects: user_id, company_name, notes, email, username
- OpenAPI shows: No h1b_applications, no resumes table
- Database has: Different fields than expected

---

## Part 8: What Actually Works

### ✓ Working Query Paths

```
✓ GET /applications
  - Returns: id, job_title, job_link, company_link, status, date_applied, created_at, updated_at
  - Code expects: id, user_id, company_name, notes (3 missing)
  - Status: Partially works, missing data

✓ GET /profiles
  - Returns: id, resume, resume_name, resume_url, resume_updated_at, created_at, updated_at
  - Code expects: email, username (added via Auth)
  - Status: Works (with workaround for email/username)

✓ GET /tracks_company
  - Used by Companies page
  - Status: Works

✓ Supabase Auth
  - Used by authService
  - Status: Works

✓ Supabase Storage
  - Used for resume file uploads
  - Status: Works

✗ GET /h1b_applications
  - Table doesn't exist
  - Status: ❌ FAILS

✗ GET /resumes (database table)
  - Table doesn't exist (but storage bucket exists)
  - Status: ❌ FAILS
```

---

## Part 9: Implementation Reality Check

### What Would Break Immediately

1. Run `npm run build` - TypeScript errors from h1b services
2. Try to access `/h1b-statistics` page - 404 or runtime error
3. Try to create an application - Silent failure (no user_id)
4. Try to query resumes metadata - Runtime error
5. Check profiles - No email/username (except from Auth)

---

## Part 10: Recommendations

### Priority 1: Database Schema (BLOCKING)

Must be done before any of this works:

```sql
-- Add missing columns to applications
ALTER TABLE applications 
ADD COLUMN user_id UUID REFERENCES auth.users(id),
ADD COLUMN company_name TEXT,
ADD COLUMN notes TEXT;

-- Create h1b_applications table (if H1B feature is needed)
CREATE TABLE h1b_applications (
  id BIGINT PRIMARY KEY,
  job_id TEXT,
  employer_name TEXT,
  job_title TEXT,
  wage_offered TEXT,
  wage_unit TEXT,
  job_location TEXT,
  wage_source TEXT,
  approved_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create resumes table (database table, not storage)
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
```

### Priority 2: Frontend Code Updates

If database changes aren't possible, update code to match database:

```typescript
// Remove references to non-existent fields
interface Application {
  id: number;
  // Remove: user_id (use JWT auth context instead)
  job_title: string;
  // Remove: company_name, use company_link
  company_link: string;  // Rename type usage from company_name
  job_link: string;
  status: ApplicationStatus;
  date_applied: string;
  // Remove: notes field
  created_at: string;
  updated_at: string;
}

// Disable H1B features until h1b_applications table exists
// Comment out: h1bStatisticsService, h1bNativeFilterService
// Hide: /h1b-statistics route
```

### Priority 3: Clean Up API

Remove unused tables from REST API or document them:

```
Keep exposed:    Remove or document:
- applications   - social_auth_* (17 tables)
- profiles       - auth_user, auth_group, etc.
- tracks_company - tracks_job, tracks_job_applicants
- jobgpt_posting - accounts_userprofile
```

### Priority 4: Standardize API Usage

```
Delete: src/pages/Internship.tsx (broken REST endpoint)
Delete: Unused axios/REST API calls
Keep: Supabase SDK calls (already modern)
```

---

## Part 11: Testing Checklist

After fixes:

```
Database Schema:
- [ ] ALTER TABLE applications - Add user_id column
- [ ] ALTER TABLE applications - Add company_name column
- [ ] ALTER TABLE applications - Add notes column
- [ ] CREATE TABLE h1b_applications (if needed)
- [ ] CREATE TABLE resumes (database table)

Frontend Testing:
- [ ] Create application - user_id saves correctly
- [ ] Update profile - email/username work
- [ ] Upload resume - Both storage AND table work
- [ ] H1B statistics page - Loads without error
- [ ] Build passes TypeScript checks

API Testing:
- [ ] GET /applications - Returns all fields
- [ ] GET /profiles - Returns all fields
- [ ] POST /applications - Inserts user_id successfully
- [ ] GET /h1b_applications - Returns data (if table exists)
- [ ] GET /resumes - Returns data (if table exists)
```

---

## Summary

### Current State: 🔴 **BROKEN**

The application has **3 layers of misalignment**:
1. Frontend expects schema X
2. OpenAPI exposes schema Y
3. Database has schema Z

Result: Features are broken across the board.

### Critical Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| Missing tables (h1b_applications, resumes) | 🔴 Critical | App crashes |
| Missing columns (user_id, company_name, notes) | 🔴 Critical | Data loss |
| Type mismatches | 🔴 Critical | Runtime errors |
| Dead API configuration | 🟡 Minor | Code debt |
| Unused legacy tables | 🟡 Minor | API clutter |

### What Must Happen

**BEFORE this code can work, the database schema MUST be updated.** Trying to ship without database schema changes will result in:
- Runtime crashes
- Silent data loss
- Broken features
- User-facing errors

**Estimated effort**: 2-3 hours to fix database schema + 1-2 hours to test.

