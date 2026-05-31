# Frontend Service Architecture

Complete guide to the frontend service layer organization and usage patterns.

---

## Overview

The frontend uses a clean, domain-driven service architecture with clear separation of concerns:

| Service | Domain | Purpose |
|---------|--------|---------|
| `authService` | Authentication & Auth | User authentication, sessions, profiles |
| `applicationsService` | Applications | Job application CRUD operations |
| `profileService` | Profile Management | User profile and resume metadata |
| `storageService` | File Storage | Resume uploads and downloads |

---

## Service Layer Architecture

```
Frontend Services
├── authService.ts          (Authentication & Profile Management)
│   ├── signUp
│   ├── signIn
│   ├── signInWithMagicLink
│   ├── signInWithProvider (OAuth)
│   ├── verifyOtp
│   ├── signOut
│   ├── getCurrentUser
│   ├── getSession
│   ├── resetPassword
│   ├── updatePassword
│   ├── isAuthenticated
│   ├── onAuthStateChange
│   ├── getProfile
│   ├── updateProfile
│   └── getSupabaseClient()
│
├── api.ts                  (Data & Storage Services)
│   ├── applicationsService (Job Applications)
│   │   ├── list()
│   │   ├── create()
│   │   ├── get()
│   │   ├── update()
│   │   ├── delete()
│   │   └── updateStatus()
│   │
│   ├── profileService     (User Profile Wrapper)
│   │   ├── getProfile()
│   │   └── updateProfile()
│   │
│   └── storageService     (Resume Management)
│       ├── uploadResume()
│       ├── deleteResume()
│       └── getPublicUrl()
│
└── Other services...
```

---

## Core Services

### 1. Authentication Service (`authService`)

**Location**: `src/services/authService.ts`

**Purpose**: Unified authentication and user management

**Key Methods**:

```typescript
// Authentication
await authService.signUp({ email, password })
await authService.signIn({ email, password })
await authService.signInWithMagicLink(email)
await authService.signInWithProvider('google' | 'github')
await authService.verifyOtp(email, token, type)
await authService.signOut()

// Session Management
await authService.getCurrentUser()
await authService.getSession()
await authService.isAuthenticated()
authService.onAuthStateChange((event, session) => { ... })

// Password Management
await authService.resetPassword(email)
await authService.updatePassword(newPassword)

// Profile Management
await authService.getProfile()
await authService.updateProfile({ username, ... })

// Client Access
authService.getSupabaseClient()
```

**Return Type**:
All methods return `AuthResponse<T>` with `{ data, error }` pattern:
```typescript
interface AuthResponse<T = any> {
  data: T | null;
  error: AuthError | null;
}
```

**Example**:
```typescript
import { authService } from '@/services/authService';

// Sign in
const { data, error } = await authService.signIn({
  email: 'user@example.com',
  password: 'password'
});

if (error) {
  console.error('Login failed:', error.message);
} else {
  console.log('Logged in as:', data?.user?.email);
}

// Get profile
const profile = await authService.getProfile();
console.log('Username:', profile?.username);
```

---

### 2. Applications Service (`applicationsService`)

**Location**: `src/services/api.ts`

**Purpose**: Job application data management (CRUD)

**Key Methods**:

```typescript
// Read
const apps = await applicationsService.list()
const app = await applicationsService.get(id)

// Create
const newApp = await applicationsService.create({
  job_title: 'Engineer',
  company_name: 'Google',
  job_link: 'https://...',
  company_link: 'https://...',
  status: 'applied',
  date_applied: new Date().toISOString()
})

// Update
const updated = await applicationsService.update(id, {
  status: 'interview',
  notes: 'Phone screen on Friday'
})

// Convenience method
const statusUpdated = await applicationsService.updateStatus(id, 'offer')

// Delete
await applicationsService.delete(id)
```

**Types**:
```typescript
interface Application {
  id: number
  user_id: string
  job_title: string
  company_name: string
  job_link: string
  company_link: string
  status: ApplicationStatus
  date_applied: string
  notes?: string
  created_at: string
  updated_at: string
}

type ApplicationStatus = 'applied' | 'in_progress' | 'rejected' | 'offer' | 'accepted' | 'oa' | 'vo'
```

**Example**:
```typescript
import { applicationsService } from '@/services/api';

// List all applications
const applications = await applicationsService.list();
console.log(`You have ${applications.length} applications`);

// Create new application
const newApp = await applicationsService.create({
  job_title: 'Senior Engineer',
  company_name: 'Microsoft',
  job_link: 'https://microsoft.com/jobs/123',
  company_link: 'https://microsoft.com',
  status: 'applied',
  date_applied: new Date().toISOString(),
  notes: 'Referred by John'
});
console.log('Application #', newApp.id);

// Update status
await applicationsService.updateStatus(newApp.id, 'oa');
```

---

### 3. Profile Service (`profileService`)

**Location**: `src/services/api.ts`

**Purpose**: User profile and resume metadata management

**Key Methods**:

```typescript
// Get current user's profile
const profile = await profileService.getProfile()

// Update profile
const updated = await profileService.updateProfile({
  username: 'johndoe',
  resume_url: 'https://...',
  resume_name: 'resume.pdf',
  ...
})
```

**Type**:
```typescript
interface UserProfile {
  id: string
  email: string
  username?: string
  resume_url?: string
  resume_name?: string
  resume?: string
  resume_updated_at?: string
  created_at: string
  updated_at: string
}
```

**Note**: This service wraps `authService.getProfile()` and `authService.updateProfile()` for convenience and consistency with other domain services.

**Example**:
```typescript
import { profileService } from '@/services/api';

// Get profile
const profile = await profileService.getProfile();
console.log('Email:', profile?.email);
console.log('Username:', profile?.username);
console.log('Resume:', profile?.resume_url);

// Update profile
const updated = await profileService.updateProfile({
  username: 'jane_doe',
  resume_name: 'Jane_Resume_2024.pdf'
});
```

---

### 4. Storage Service (`storageService`)

**Location**: `src/services/api.ts`

**Purpose**: Resume file upload/download management

**Key Methods**:

```typescript
// Upload resume file
const result = await storageService.uploadResume(file)

// Delete resume file
await storageService.deleteResume(filePath)

// Get public URL for resume
const url = storageService.getPublicUrl(filePath)
```

**Return Types**:
```typescript
interface UploadResult {
  filePath: string        // Path in storage bucket
  publicUrl: string       // Public URL to access file
  fileName: string        // Original filename
  fileSize: number        // File size in bytes
}
```

**Storage Details**:
- **Bucket**: `resumes`
- **Path Structure**: `{user_id}/{timestamp}-{random}.{extension}`
- **Visibility**: Private (authenticated users only)

**Example**:
```typescript
import { storageService, profileService } from '@/services/api';

// Upload resume
const file = new File(['PDF content...'], 'resume.pdf');
const uploadResult = await storageService.uploadResume(file);

console.log('File path:', uploadResult.filePath);
console.log('Public URL:', uploadResult.publicUrl);

// Update profile with resume info
await profileService.updateProfile({
  resume: uploadResult.filePath,
  resume_name: uploadResult.fileName,
  resume_url: uploadResult.publicUrl,
  resume_updated_at: new Date().toISOString()
});

// Later: Get public URL
const url = storageService.getPublicUrl('user-id/timestamp-random.pdf');
console.log('Download at:', url);
```

---

## Error Handling Patterns

### Auth Service (AuthResponse Pattern)
```typescript
const { data, error } = await authService.signIn({ email, password });

if (error) {
  console.error('Login failed:', error.message);
  // Handle error
} else {
  console.log('Logged in:', data?.user?.email);
  // Continue
}
```

### Applications & Profile Services (Try/Catch Pattern)
```typescript
try {
  const apps = await applicationsService.list();
  console.log('Applications:', apps);
} catch (error) {
  console.error('Failed to load applications:', error);
  // Handle error
}
```

### Storage Service (Try/Catch Pattern)
```typescript
try {
  const result = await storageService.uploadResume(file);
  console.log('Upload successful:', result.publicUrl);
} catch (error) {
  console.error('Upload failed:', error);
  // Handle error
}
```

---

## Complete Example: Application Workflow

```typescript
import { authService } from '@/services/authService';
import { applicationsService, profileService, storageService } from '@/services/api';

// 1. User signs in
const { data: signInData, error: signInError } = await authService.signIn({
  email: 'user@example.com',
  password: 'password'
});

if (signInError) {
  console.error('Login failed');
  return;
}

// 2. Get user profile
const profile = await profileService.getProfile();
console.log('Welcome,', profile?.username);

// 3. Upload resume if needed
if (!profile?.resume_url) {
  const file = new File(['resume content'], 'resume.pdf');
  const uploadResult = await storageService.uploadResume(file);
  
  await profileService.updateProfile({
    resume: uploadResult.filePath,
    resume_name: uploadResult.fileName,
    resume_url: uploadResult.publicUrl,
    resume_updated_at: new Date().toISOString()
  });
}

// 4. Create new application
const newApp = await applicationsService.create({
  job_title: 'Senior Engineer',
  company_name: 'Google',
  job_link: 'https://google.com/jobs/123',
  company_link: 'https://google.com',
  status: 'applied',
  date_applied: new Date().toISOString(),
  notes: 'Referred by Jane'
});

// 5. List all applications
const allApps = await applicationsService.list();
console.log(`Total applications: ${allApps.length}`);

// 6. Update application status
await applicationsService.updateStatus(newApp.id, 'oa');

// 7. Sign out
await authService.signOut();
```

---

## Backward Compatibility

For legacy code migration:

```typescript
// Old (deprecated)
import { applicationsApi } from '@/services/api';
const apps = await applicationsApi.list();

// New (recommended)
import { applicationsService } from '@/services/api';
const apps = await applicationsService.list();

// Both work! applicationsApi is an alias for backward compatibility
```

---

## Testing Services

When testing, mock the Supabase client:

```typescript
import { vi } from 'vitest';
import { applicationsService } from '@/services/api';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockApplication,
            error: null
          })
        }))
      }))
    }))
  }
}));

test('should fetch application', async () => {
  const app = await applicationsService.get(1);
  expect(app.id).toBe(1);
});
```

---

## Related Documentation

- [SUPABASE_TYPES.md](./SUPABASE_TYPES.md) - Database table schemas and types
- [authService.ts](./src/services/authService.ts) - Authentication service source
- [api.ts](./src/services/api.ts) - Applications, profile, and storage services source
- [Supabase Documentation](https://supabase.com/docs) - Database and SDK reference
