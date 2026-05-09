/**
 * Supabase Database Types
 * Auto-generated type definitions for Supabase tables used in the application
 * These types are based on actual database tables, not REST API paths
 */

// ============================================================================
// Applications Table Types
// ============================================================================

export type ApplicationStatus = 'applied' | 'in_progress' | 'rejected' | 'offer' | 'accepted' | 'oa' | 'vo';

export interface Application {
  id: number;
  user_id: string;
  job_title: string;
  company_name: string;
  job_link: string;
  company_link: string;
  status: ApplicationStatus;
  date_applied: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type ApplicationUpdate = Partial<ApplicationInsert>;

// ============================================================================
// User Profiles Table Types
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  resume_url?: string;
  resume_name?: string;
  resume: string; // resume file path in storage
  resume_updated_at?: string;
  created_at: string;
  updated_at: string;
}

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type UserProfileUpdate = Partial<UserProfileInsert>;

// ============================================================================
// Resumes Table Types (Storage metadata)
// ============================================================================

export interface Resume {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  public_url: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export type ResumeInsert = Omit<Resume, 'id' | 'created_at' | 'updated_at'>;
export type ResumeUpdate = Partial<ResumeInsert>;

// ============================================================================
// Job Posting Types (from jobgpt_jobposting table)
// ============================================================================

export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export interface JobPosting {
  id: number;
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  salary_range?: string;
  employment_type: EmploymentType;
  status: JobStatus;
  url?: string;
  created_at: string;
  updated_at: string;
}

export type JobPostingInsert = Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>;
export type JobPostingUpdate = Partial<JobPostingInsert>;

// ============================================================================
// Company Types
// ============================================================================

export interface Company {
  id: number;
  name: string;
  website?: string;
  logo_url?: string;
  headquarters?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'>;
export type CompanyUpdate = Partial<CompanyInsert>;

// ============================================================================
// Type Guards
// ============================================================================

export function isApplication(obj: any): obj is Application {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.job_title === 'string' &&
    typeof obj.company_name === 'string'
  );
}

export function isUserProfile(obj: any): obj is UserProfile {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string'
  );
}

export function isJobPosting(obj: any): obj is JobPosting {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.company === 'string'
  );
}
