export type ProcessStage = 'Resume' | 'Phone Screen' | 'Technical' | 'Onsite' | 'Offer';
export type ApplicationStatus = 'Applied' | 'In Progress' | 'Rejected' | 'Offer' | 'Accepted';

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
  outcome: ApplicationOutcome;
  job_title: string;
  company_name: string;
  application_link: string;
  OA_date: string | null;
  VO_date: string | null;
  created: string;
  updated: string;
  applicant: string;
  job?: Job;
}