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

export type ProcessStage = 'Resume' | 'Phone Screen' | 'Technical' | 'Onsite' | 'Offer';
export type ApplicationStatus = 'Applied' | 'In Progress' | 'Rejected' | 'Offer' | 'Accepted';