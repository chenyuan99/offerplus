# Supabase Database Types Documentation

This document describes the TypeScript type definitions for all Supabase tables used in the OfferPlus frontend application.

**Location**: `src/types/supabase.ts`

---

## Table of Contents

1. [Applications Table](#applications-table)
2. [User Profiles Table](#user-profiles-table)
3. [Resumes Table](#resumes-table)
4. [Job Postings Table](#job-postings-table)
5. [Companies Table](#companies-table)
6. [Type Guards](#type-guards)
7. [Usage Examples](#usage-examples)

---

## Applications Table

The `applications` table stores user job applications with tracking information.

### Type Definition

```typescript
interface Application {
  id: number;                    // Auto-generated primary key
  user_id: string;               // Supabase auth user ID (UUID)
  job_title: string;             // Job position title
  company_name: string;          // Company name
  job_link: string;              // URL to job posting
  company_link: string;          // URL to company website
  status: ApplicationStatus;     // Current application status
  date_applied: string;          // ISO 8601 date string
  notes?: string;                // Optional notes about application
  created_at: string;            // Timestamp when created
  updated_at: string;            // Timestamp when last updated
}

type ApplicationStatus = 
  | 'applied'      // Initial application submitted
  | 'in_progress'  // Under consideration
  | 'rejected'     // Application rejected
  | 'offer'        // Offer received
  | 'accepted'     // Offer accepted
  | 'oa'          // Online assessment in progress
  | 'vo';         // Video interview in progress

// For creating new applications (omit id and timestamps)
type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

// For updating applications
type ApplicationUpdate = Partial<ApplicationInsert>;
```

### Usage Examples

```typescript
import { applicationsApi } from '@/services/api';
import type { Application, ApplicationInsert } from '@/types/supabase';

// List all applications
const apps: Application[] = await applicationsApi.list();

// Create application
const newApp: ApplicationInsert = {
  job_title: 'Senior Engineer',
  company_name: 'Google',
  job_link: 'https://google.com/jobs/123',
  company_link: 'https://google.com',
  status: 'applied',
  date_applied: new Date().toISOString(),
};
const created = await applicationsApi.create(newApp);

// Update application status
const updated = await applicationsApi.update(1, {
  status: 'interview',
  notes: 'Phone screen scheduled for Friday',
});

// Delete application
await applicationsApi.delete(1);
```

---

## User Profiles Table

The `profiles` table stores user profile information and resume metadata.

### Type Definition

```typescript
interface UserProfile {
  id: string;                   // Supabase auth user ID (UUID)
  email: string;                // User email address
  username?: string;            // Optional username
  resume_url?: string;          // Public URL to resume file
  resume_name?: string;         // Original resume filename
  resume?: string;              // Resume file path in storage bucket
  resume_updated_at?: string;   // When resume was last updated
  created_at: string;           // Profile creation timestamp
  updated_at: string;           // Profile update timestamp
}

type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
type UserProfileUpdate = Partial<UserProfileInsert>;
```

### Usage Examples

```typescript
import { apiService } from '@/services/api';
import type { UserProfile } from '@/types/supabase';

// Get current user's profile
const profile: UserProfile = await apiService.getUserProfile();
console.log(`Resume: ${profile.resume_url}`);

// Upload resume
const file = new File(['resume content'], 'resume.pdf');
const updated: UserProfile = await apiService.uploadResume(file);
console.log(`Resume updated at: ${updated.resume_updated_at}`);

// Delete resume
const cleared: UserProfile = await apiService.deleteResume();
console.log(`Resume cleared, URL: ${cleared.resume_url}`); // null
```

---

## Resumes Table

The `resumes` table stores metadata about uploaded resume files in Supabase Storage.

### Type Definition

```typescript
interface Resume {
  id: string;                   // Auto-generated primary key (UUID)
  user_id: string;              // Supabase auth user ID
  file_path: string;            // Path in storage: `{user_id}/{filename}`
  file_name: string;            // Original filename (e.g., 'resume.pdf')
  file_size: number;            // File size in bytes
  mime_type: string;            // MIME type (e.g., 'application/pdf')
  public_url: string;           // Public URL to access file
  uploaded_at: string;          // When file was uploaded
  created_at: string;           // Record creation timestamp
  updated_at: string;           // Record update timestamp
}

type ResumeInsert = Omit<Resume, 'id' | 'created_at' | 'updated_at'>;
```

### Storage Bucket

- **Bucket Name**: `resumes`
- **Path Structure**: `{user_id}/{timestamp}-{random}.{extension}`
- **Visibility**: Private (authenticated users only)

### RLS Policies

The `resumes` table should have the following RLS (Row Level Security) policies:

```sql
-- Users can view their own resumes
CREATE POLICY "Users can view their own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own resumes
CREATE POLICY "Users can insert their own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own resumes
CREATE POLICY "Users can update their own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own resumes
CREATE POLICY "Users can delete their own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);
```

### Usage Example

```typescript
import { supabase } from '@/lib/supabase';
import type { Resume } from '@/types/supabase';

// Query user's resumes
const { data: resumes, error } = await supabase
  .from('resumes')
  .select('*')
  .eq('user_id', userId);

if (error) throw error;

// Display resume info
resumes.forEach(resume => {
  console.log(`
    File: ${resume.file_name}
    Size: ${resume.file_size} bytes
    Uploaded: ${new Date(resume.uploaded_at).toLocaleString()}
    URL: ${resume.public_url}
  `);
});
```

---

## Job Postings Table

The `jobgpt_jobposting` table stores job listings from various sources.

### Type Definition

```typescript
interface JobPosting {
  id: number;                      // Auto-generated primary key
  title: string;                   // Job position title
  company: string;                 // Company name
  description: string;             // Job description
  requirements: string;            // Required qualifications
  location: string;                // Job location
  salary_range?: string;           // Optional salary range
  employment_type: EmploymentType; // Type of employment
  status: JobStatus;               // Job posting status
  url?: string;                    // Link to original posting
  created_at: string;              // Record creation timestamp
  updated_at: string;              // Record update timestamp
}

type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';

type JobPostingInsert = Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>;
type JobPostingUpdate = Partial<JobPostingInsert>;
```

### Usage Example

```typescript
import { supabase } from '@/lib/supabase';
import type { JobPosting } from '@/types/supabase';

// Find open full-time jobs
const { data: jobs } = await supabase
  .from('jobgpt_jobposting')
  .select('*')
  .eq('status', 'OPEN')
  .eq('employment_type', 'FULL_TIME')
  .order('created_at', { ascending: false });

jobs?.forEach(job => {
  console.log(`${job.title} at ${job.company} in ${job.location}`);
});
```

---

## Companies Table

The `tracks_company` table stores company information.

### Type Definition

```typescript
interface Company {
  id: number;                    // Auto-generated primary key
  name: string;                  // Company name
  website?: string;              // Company website URL
  logo_url?: string;             // URL to company logo
  headquarters?: string;         // Headquarters location
  description?: string;          // Company description
  created_at: string;            // Record creation timestamp
  updated_at: string;            // Record update timestamp
}

type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'>;
type CompanyUpdate = Partial<CompanyInsert>;
```

### Usage Example

```typescript
import { supabase } from '@/lib/supabase';
import type { Company } from '@/types/supabase';

// Get company details
const { data: company } = await supabase
  .from('tracks_company')
  .select('*')
  .eq('name', 'Google')
  .single();

console.log(`
  ${company.name}
  Website: ${company.website}
  Headquarters: ${company.headquarters}
`);
```

---

## Type Guards

Helper functions to check types at runtime:

```typescript
import { 
  isApplication, 
  isUserProfile, 
  isJobPosting 
} from '@/types/supabase';

// Type guard example
const obj: unknown = fetchData();

if (isApplication(obj)) {
  console.log(`Application status: ${obj.status}`);
}

if (isUserProfile(obj)) {
  console.log(`User email: ${obj.email}`);
}

if (isJobPosting(obj)) {
  console.log(`Job title: ${obj.title}`);
}
```

---

## Usage Examples

### Complete Flow: Create and Track Application

```typescript
import { applicationsApi, apiService } from '@/services/api';
import type { ApplicationInsert } from '@/types/supabase';

// Step 1: Get user profile
const profile = await apiService.getUserProfile();
console.log(`Logged in as: ${profile.email}`);

// Step 2: Create application
const newApp: ApplicationInsert = {
  job_title: 'Senior React Developer',
  company_name: 'Vercel',
  job_link: 'https://vercel.com/careers/senior-engineer',
  company_link: 'https://vercel.com',
  status: 'applied',
  date_applied: new Date().toISOString(),
  notes: 'Referred by John Doe',
};

const application = await applicationsApi.create(newApp);
console.log(`Created application #${application.id}`);

// Step 3: List all applications
const allApps = await applicationsApi.list();
console.log(`Total applications: ${allApps.length}`);

// Step 4: Update application status
await applicationsApi.update(application.id, {
  status: 'oa',
  notes: 'Online assessment sent on 2024-01-15',
});

console.log(`Application updated to OA status`);
```

### Upload and Manage Resume

```typescript
import { apiService } from '@/services/api';

// Upload a resume
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput.files) {
  const file = fileInput.files[0];
  const updated = await apiService.uploadResume(file);
  console.log(`Resume uploaded: ${updated.resume_url}`);
}

// Get resume URL for sharing
const profile = await apiService.getUserProfile();
if (profile.resume_url) {
  console.log(`Share your resume: ${profile.resume_url}`);
}

// Replace existing resume
const newResume = new File(['new content'], 'resume-v2.pdf');
const updated2 = await apiService.uploadResume(newResume);
console.log(`Resume updated at: ${updated2.resume_updated_at}`);

// Delete resume
const cleared = await apiService.deleteResume();
console.log(`Resume deleted`);
```

---

## Migration from Old Types

If you're using the old type system, here's how to migrate:

### Before (Old)
```typescript
import { ApplicationRecord } from '@/types';
const apps: ApplicationRecord[] = await fetchApps();
```

### After (New)
```typescript
import { applicationsApi } from '@/services/api';
import type { Application } from '@/types/supabase';
const apps: Application[] = await applicationsApi.list();
```

---

## See Also

- [API Analysis](../API_ANALYSIS.md) - Architecture and API patterns
- [DESIGN.md](DESIGN.md) - UI/UX design system
- [Supabase Documentation](https://supabase.com/docs) - Supabase reference
- [Services Documentation](src/services/api.ts) - API service implementation
