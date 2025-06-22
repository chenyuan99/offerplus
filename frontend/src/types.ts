export type ProcessStage = 'Resume' | 'Phone Screen' | 'Technical' | 'Onsite' | 'Offer';
export type ApplicationStatus = 'applied' | 'in_progress' | 'rejected' | 'offer' | 'accepted' | 'oa' | 'vo';
export type ApplicationOutcome = 
  | 'TO DO'
  | 'IN PROGRESS'
  | 'REFER'
  | 'REJECT(Resume)'
  | 'REJECT(VO)'
  | 'REJECT(OA)'
  | 'VO'
  | 'OA';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type ApplicationSource = 'Manual' | 'Gmail' | 'LinkedIn' | 'Indeed' | 'Other';

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
  status: ApplicationStatus;
  notes: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  website: string;
  location: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  title: string;
  company: Company;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  employment_type: EmploymentType;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  deadline: string | null;
}

export interface ApplicationRecord {
  id: number;
  job_title: string;
  job_link: string;
  company_link: string;
  status: ApplicationStatus;
  date_applied: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}