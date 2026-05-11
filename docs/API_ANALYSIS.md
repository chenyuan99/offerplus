# OpenAPI Spec vs Frontend Implementation Analysis

## Overview

There is a **significant mismatch** between your OpenAPI spec and how your frontend actually uses the API. This analysis identifies the issues and recommends improvements.

---

## 🔴 Key Mismatches

### 1. **Two Different API Approaches**

**What the OpenAPI spec shows:**
- REST API endpoints like `/applications`, `/profiles`, `/jobgpt_jobposting`
- Built from Supabase PostgREST (auto-generated from database schema)
- Requires authentication headers

**What your frontend actually uses:**
- Supabase JavaScript SDK (`.from()`, `.select()`, `.insert()`, etc.)
- Direct database queries (not REST calls)
- Built-in auth handling via `supabase` client

**Why this matters:**
- ❌ Your TypeScript types reference REST endpoints that your code doesn't use
- ❌ Inconsistent import statements (you import `paths` types but don't use them)
- ❌ Misleading API documentation
- ❌ Makes it harder for new developers to understand the architecture

---

## 📋 Detailed Issues

### Issue #1: Incorrect Type Imports

**Current code** (`services/api.ts:47-48`):
```typescript
export type Application = paths['/api/applications/']['get']['responses']['200']...
export type ApplicationInput = paths['/api/applications/']['post']['requestBody']...
```

**Problem:**
- These paths don't exist in your OpenAPI spec
- Should be `/applications` not `/api/applications/`
- Your actual code uses Supabase SDK, not REST

**What you actually have:**
```typescript
// Real implementation (lines 62-105)
export const applicationsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('applications')  // ← Direct SDK call
      .select('*')
      .order('created_at', { ascending: false });
```

---

### Issue #2: Inconsistent API Layer

Your codebase mixes two approaches:

**Axios REST API** (outdated):
```typescript
const api = axios.create({
  baseURL: API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  getUser: () => api.get('/api/auth/user/'),    // ← REST endpoint
  login: (credentials) => api.post('/api/auth/login/', credentials),
};
```

**Supabase SDK** (active):
```typescript
export const applicationsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('applications')   // ← SDK client
      .select('*');
```

**Why problematic:**
- Maintaining both approaches is complex
- Type system doesn't match implementation
- Authentication handled differently (axios interceptors vs supabase client)

---

### Issue #3: Database Schema Mismatch

**What OpenAPI shows exists:**
- `profiles` ✅
- `applications` ✅
- `tracks_applicationrecord` ✅
- `jobgpt_jobposting` ✅
- Django auth tables (`auth_user`, `auth_group`) ⚠️
- Social auth tables (unused in frontend)

**What frontend actually uses:**
- `applications` ✅ (via Supabase SDK)
- `profiles` ✅ (via Supabase SDK)
- `resumes` ❓ (table not documented in OpenAPI)

**What's missing from OpenAPI:**
- `resumes` table (you use it, but it's not in the spec!)

---

## ✅ Recommended Improvements

### Priority 1: Fix the Immediate Issues

#### 1a. Remove Unused REST API Types
```typescript
// ❌ DON'T DO THIS (doesn't exist)
export type Application = paths['/api/applications/']['get']...

// ✅ DO THIS INSTEAD (use actual table types)
export interface Application {
  id: number;
  company_name: string;
  job_title: string;
  status: 'applied' | 'interview' | 'rejected' | 'accepted';
  // ... other fields
}
```

#### 1b. Standardize on Supabase SDK
Remove axios REST API calls and use Supabase SDK exclusively:

```typescript
// ❌ Remove this
const api = axios.create({ baseURL: API_URL, ... });
export const authApi = { getUser: () => api.get('/api/auth/user/') };

// ✅ Use this instead
export const authApi = {
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
};
```

#### 1c. Add Missing Tables to OpenAPI
Your `resumes` table is not exposed. Either:
- **Option A:** Add it to Supabase REST API by enabling RLS policies
- **Option B:** Regenerate OpenAPI spec to include it
- **Option C:** Use custom types instead of relying on OpenAPI

```bash
# Regenerate OpenAPI if you exposed resumes table
npx openapi-typescript ../backend/openapi.yaml -o src/types/api.ts
```

---

### Priority 2: Improve Type Safety

Create a `types/api.ts` based on actual Supabase tables (not REST paths):

```typescript
// src/types/api.ts
export interface Application {
  id: number;
  user_id: string;
  company_name: string;
  job_title: string;
  status: ApplicationStatus;
  salary_min?: number;
  salary_max?: number;
  location?: string;
  date_applied: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'accepted';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  resume_url?: string;
  resume_name?: string;
  resume_updated_at?: string;
  created_at: string;
  updated_at: string;
}
```

---

### Priority 3: Consolidate API Services

Reorganize `services/api.ts` to be cleaner:

```typescript
// src/services/api.ts
import { supabase } from '@/lib/supabase';
import type { Application, UserProfile } from '@/types/api';

// Separate concerns by domain
export const applicationsService = {
  async list() { /* ... */ },
  async create(data: Application) { /* ... */ },
  async update(id: number, data: Partial<Application>) { /* ... */ },
  async delete(id: number) { /* ... */ },
};

export const profileService = {
  async getProfile(): Promise<UserProfile> { /* ... */ },
  async updateProfile(updates: Partial<UserProfile>) { /* ... */ },
};

export const storageService = {
  async uploadResume(file: File) { /* ... */ },
  async deleteResume() { /* ... */ },
};
```

---

### Priority 4: Generate Accurate OpenAPI Docs

If you want REST API docs:

**Option A: Use Supabase REST API directly**
```bash
# Every table with RLS policies is exposed at:
# https://lwexhbimtxpndhsidogl.supabase.co/rest/v1/applications
# https://lwexhbimtxpndhsidogl.supabase.co/rest/v1/profiles
```

**Option B: Create custom OpenAPI spec**
If you have a custom backend (Django):
```bash
# Generate from your backend OpenAPI docs
# Not from Supabase
python manage.py spectacular --file backend-openapi.yaml
```

---

## 📊 Comparison Table

| Aspect | Current State | Issues | Recommendation |
|--------|--------------|--------|-----------------|
| API Layer | Mixed (Axios + SDK) | Confusing, hard to maintain | Use **Supabase SDK only** |
| Types | REST path-based (`/api/applications/`) | Don't match actual usage | Use **table-based types** |
| REST API | Generated from Supabase | Limited docs, auto-generated | **Accept as-is or skip it** |
| Authentication | Dual approach (JWT + Supabase) | Inconsistent | Use **Supabase auth only** |
| Database Tables | 20+ exposed via Supabase | Some unused | **Clean up unused tables** |

---

## 🎯 Action Items

### Immediate (This Sprint)
- [ ] Fix type imports in `services/api.ts` (remove incorrect `/api/` paths)
- [ ] Remove unused Axios `api` client if not used by backend
- [ ] Create proper `types/api.ts` based on actual Supabase tables
- [ ] Add missing `resumes` table to OpenAPI or create custom type

### Short-term (Next Sprint)
- [ ] Consolidate API services (remove duplication)
- [ ] Standardize on Supabase SDK across all services
- [ ] Add JSDoc comments with proper examples
- [ ] Update error handling to be consistent

### Long-term
- [ ] Consider if REST API is needed (keep only if backend uses it)
- [ ] Regenerate types when schema changes
- [ ] Document which tables are actually used vs. available

---

## ✨ Example: After Improvements

```typescript
// src/services/api.ts (clean, type-safe)
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus } from '@/types/api';

export const applicationsService = {
  /**
   * Fetch user's job applications
   * @returns Application[]
   */
  async list() {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('date_applied', { ascending: false });
    
    if (error) throw error;
    return data as Application[];
  },

  /**
   * Create new application
   * @param app Application data (without id, timestamps)
   * @returns Created Application with id
   */
  async create(app: Omit<Application, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('applications')
      .insert([app])
      .select()
      .single();
    
    if (error) throw error;
    return data as Application;
  },

  /**
   * Update application status
   */
  async updateStatus(id: number, status: ApplicationStatus) {
    const { data, error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Application;
  },
};
```

---

## Summary

| Found | Severity | Fix Difficulty |
|-------|----------|-----------------|
| Wrong type paths (`/api/applications/` doesn't exist) | 🔴 High | Easy |
| Unused REST API layer | 🟡 Medium | Medium |
| Missing table in OpenAPI | 🟡 Medium | Medium |
| Inconsistent auth approach | 🟡 Medium | Medium |
| No type safety for DB queries | 🟡 Medium | Easy |

**Estimated effort to fix all:** 2-4 hours

**Recommended priority:** Start with Priority 1 items (easy wins)
