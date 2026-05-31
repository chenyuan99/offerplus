/**
 * Legacy type definitions (deprecated)
 * Please use types from src/types/supabase.ts instead
 *
 * These are kept for backward compatibility only and will be removed in a future version
 */

// Re-export main types from supabase.ts for backward compatibility
export type {
  Application,
  ApplicationInsert,
  ApplicationUpdate,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  Resume,
  ResumeInsert,
  ApplicationStatus,
  JobStatus,
  EmploymentType,
  Company,
  JobPosting,
  CompanyInsert,
  CompanyUpdate,
} from './supabase';

// Legacy aliases (deprecated - use supabase.ts instead)
export type ProcessStage = 'Resume' | 'Phone Screen' | 'Technical' | 'Onsite' | 'Offer';
export type ApplicationOutcome =
  | 'TO DO'
  | 'IN PROGRESS'
  | 'REFER'
  | 'REJECT(Resume)'
  | 'REJECT(VO)'
  | 'REJECT(OA)'
  | 'VO'
  | 'OA';
export type ApplicationSource = 'Manual' | 'Gmail' | 'LinkedIn' | 'Indeed' | 'Other';

/**
 * @deprecated Use Application from types/supabase.ts instead
 */
export interface JobApplication {
  id: string;
  role: string;
  company: string;
  location: string;
  industry: string;
  poc: string;
  agent: string;
  process: ProcessStage;
  appliedDate: string;
  status: string;
  notes: string;
}

/**
 * @deprecated Use Application from types/supabase.ts instead
 */
export interface ApplicationRecord {
  id: number;
  job_title: string;
  job_link: string;
  company_link: string;
  status: string;
  date_applied: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}