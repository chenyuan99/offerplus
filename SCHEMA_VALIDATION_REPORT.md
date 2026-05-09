# Schema Validation Report: Database vs Frontend Implementation

**Date**: 2026-05-09  
**Status**: ⚠️ **CRITICAL MISMATCHES FOUND**

---

## Executive Summary

There are **significant mismatches** between the Supabase database schema and the TypeScript type definitions in the frontend code. The frontend code is trying to use fields that don't exist in the database, which will cause runtime errors.

---

## Critical Issues

### 1. ❌ Applications Table - Missing Fields

**Database actual fields:**
```json
[
  "company_link",
  "created_at",
  "date_applied",
  "id",
  "job_link",
  "job_title",
  "status",
  "updated_at"
]
```

**Frontend types expect** (in `src/types/supabase.ts`):
```typescript
interface Application {
  id: number;
  user_id: string;           // ❌ NOT IN DATABASE
  job_title: string;         // ✓ OK
  company_name: string;      // ❌ NOT IN DATABASE
  job_link: string;          // ✓ OK
  company_link: string;      // ✓ OK
  status: ApplicationStatus; // ✓ OK
  date_applied: string;      // ✓ OK
  notes?: string;            // ❌ NOT IN DATABASE
  created_at: string;        // ✓ OK
  updated_at: string;        // ✓ OK
}
```

**Mismatches:**
| Field | Database | Frontend | Issue |
|-------|----------|----------|-------|
| `user_id` | ❌ No | ✓ Yes | Code assumes user_id but DB doesn't have it |
| `company_name` | ❌ No | ✓ Yes | Code uses company_name but DB only has company_link |
| `notes` | ❌ No | ✓ Yes | Code uses notes but DB doesn't have it |

**Impact:**
- `applicationsApi.create()` tries to set `user_id` - will fail or be ignored
- Code references `company_name` - will get `undefined`
- Code references `notes` - will get `undefined`

---

### 2. ❌ Profiles Table - Missing Fields

**Database actual fields** (from OpenAPI spec):
```json
{
  "id": "uuid",
  "resume": "string",
  "resume_name": "string",
  "resume_url": "string",
  "resume_updated_at": "timestamp",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Frontend types expect** (in `src/types/supabase.ts`):
```typescript
export interface UserProfile {
  id: string;                   // ✓ OK
  email: string;                // ❌ NOT IN DATABASE
  username?: string;            // ❌ NOT IN DATABASE
  resume_url?: string;          // ✓ OK
  resume_name?: string;         // ✓ OK
  resume?: string;              // ✓ OK
  resume_updated_at?: string;   // ✓ OK
  created_at: string;           // ✓ OK
  updated_at: string;           // ✓ OK
}
```

**Mismatches:**
| Field | Database | Frontend | Issue |
|-------|----------|----------|-------|
| `email` | ❌ No | ✓ Yes | Code assumes email but DB doesn't have it |
| `username` | ❌ No | ✓ Yes | Code assumes username but DB doesn't have it |

**Impact:**
- Profiles won't have email/username data
- `authService.getProfile()` returns undefined for these fields
- Frontend displays "undefined" for these fields

---

### 3. ❌ Missing `resumes` Table

**Database:**  
The `resumes` table is NOT exposed in the Supabase REST API

**Frontend code:**  
None of the current code directly queries a `resumes` table, but the documentation and architecture suggest it should exist.

**Available tables in OpenAPI spec:**
```
- applications ✓
- profiles ✓
- jobgpt_jobposting
- tracks_company
- (various Django auth tables)
- (no resumes table)
```

---

## Code Analysis

### Problem 1: Creating Applications

**File**: `src/services/api.ts` (lines 92-109)

```typescript
create: async (data: ApplicationInsert): Promise<Application> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from('applications')
      .insert([{ ...data, user_id: user.id }])  // ❌ user_id doesn't exist!
      .select()
      .single();
    // ...
```

**Issue**: Code tries to insert `user_id` but the database table doesn't have this column. The insert will likely fail or silently ignore the `user_id` field.

**Fix needed**: Remove `user_id: user.id` from the insert, or update the database schema to include `user_id`.

---

### Problem 2: Company Name vs Company Link

**File**: `src/services/api.ts` (lines 15-24 in types)

The API documentation example shows:
```typescript
const newApp = await applicationsApi.create({
  job_title: 'Senior Engineer',
  company_name: 'Google',      // ❌ Field doesn't exist!
  job_link: 'https://google.com/jobs/123',
  company_link: 'https://google.com',
  // ...
});
```

But the database only has `company_link`, not `company_name`.

**Fix needed**: Use `job_link` and `company_link` only, or update database schema to include `company_name`.

---

### Problem 3: Missing Email/Username in Profiles

**File**: `src/services/authService.ts` (lines 316-350)

```typescript
async getProfile(): Promise<UserProfile | null> {
  try {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet - return defaults
      return {
        id: user.id,
        email: user.email || '',        // ✓ Gets from auth, not profiles table
        username: user.user_metadata?.username || user.email?.split('@')[0],
        // ...
      };
    }
    // ...
```

**Status**: Actually OKAY - email and username come from Supabase Auth, not the profiles table. The code handles this correctly by returning defaults when the profile doesn't exist.

---

## Recommendations

### Priority 1: Fix Applications Table Schema

**Option A: Update Database Schema** (Recommended)
Add these columns to the `applications` table:
```sql
ALTER TABLE applications 
ADD COLUMN user_id UUID REFERENCES auth.users(id),
ADD COLUMN company_name TEXT,
ADD COLUMN notes TEXT;
```

**Option B: Update Frontend Types** (Not recommended - loses functionality)
Modify types to match database, but this loses data fields.

---

### Priority 2: Add Missing Fields to Profiles

**Add to Profiles Table:**
```sql
ALTER TABLE profiles
ADD COLUMN email TEXT,
ADD COLUMN username TEXT;
```

Or: Accept that email/username come from auth, not profiles (current approach is fine).

---

### Priority 3: Create Resumes Table (Optional)

If you want to track resume metadata separately:
```sql
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

CREATE POLICY "Users can view their own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Action Items

### Immediate (Fix to match current code)

- [ ] Add `user_id` column to `applications` table
- [ ] Add `company_name` column to `applications` table  
- [ ] Add `notes` column to `applications` table
- [ ] Optionally: Add `email` and `username` columns to `profiles` table

### Testing

After schema changes:
```bash
# Verify new columns exist
curl https://lwexhbimtxpndhsidogl.supabase.co/rest/v1/applications?limit=1 \
  -H "apikey: YOUR_KEY" | jq '.[0] | keys'

# Should include: ["user_id", "company_name", "notes", ...]
```

### Long-term

- [ ] Document actual database schema in SCHEMA.md
- [ ] Auto-generate TypeScript types from actual schema
- [ ] Add integration tests to catch schema mismatches
- [ ] Consider using Supabase migrations for schema management

---

## Files Affected

**Frontend types:**
- `frontend/src/types/supabase.ts` - Expects fields not in database

**Frontend services:**
- `frontend/src/services/api.ts` - Creates applications with user_id
- `frontend/src/services/authService.ts` - Gets profiles (email OK, username OK)

**Documentation:**
- `frontend/SUPABASE_TYPES.md` - Documents wrong schema
- `frontend/SERVICE_ARCHITECTURE.md` - Uses wrong field names in examples

---

## Summary

The **most critical issue** is the `applications` table is missing:
1. `user_id` - Used to associate applications with users
2. `company_name` - Used to store company name
3. `notes` - Used to store application notes

**These must be added to the database schema, OR the frontend code must be updated to not use these fields.**

Current code will fail or produce unexpected results when:
- Creating an application (user_id insert fails)
- Accessing company_name (returns undefined)
- Accessing notes (returns undefined)
