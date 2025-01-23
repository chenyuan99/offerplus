import { JobApplication } from '../types';

export const mockJobs: Omit<JobApplication, 'id'>[] = [
  {
    role: 'Software Engineer',
    company: 'Apple',
    location: 'Cupertino, CA',
    industry: 'Technology',
    poc: 'Gollapalli Mounica',
    agent: 'Innova Solutions',
    process: 'Technical',
    appliedDate: '2024-03-01',
    status: 'In Progress',
    notes: 'Assessment stage'
  },
  {
    role: 'Software Engineer',
    company: 'Chase',
    location: 'New York',
    industry: 'FinTech',
    poc: 'Nelly Perez',
    agent: 'Judge',
    process: 'Phone Screen',
    appliedDate: '2024-02-28',
    status: 'In Progress',
    notes: 'Initial phone screen scheduled'
  },
  {
    role: 'Web Engineer',
    company: 'Robinhood',
    location: 'Remote',
    industry: 'FinTech',
    poc: '',
    agent: '',
    process: 'Resume',
    appliedDate: '2024-02-25',
    status: 'Applied',
    notes: 'Application submitted'
  },
  {
    role: 'Full Stack Engineer',
    company: 'Retool',
    location: 'San Francisco',
    industry: 'SaaS',
    poc: 'Marcel Thompson',
    agent: 'Hirefly',
    process: 'Phone Screen',
    appliedDate: '2024-02-20',
    status: 'In Progress',
    notes: 'Rohan Nagensh (Hirefly) -> Marcel Thompson (Retool)'
  },
  {
    role: 'Software Engineer',
    company: 'Uber',
    location: 'San Francisco',
    industry: 'Technology',
    poc: '',
    agent: '',
    process: 'Phone Screen',
    appliedDate: '2024-02-15',
    status: 'In Progress',
    notes: 'Phone screen scheduled for next week'
  },
  {
    role: 'Software Engineer',
    company: 'Tesla',
    location: 'Austin',
    industry: 'Automotive/Technology',
    poc: 'Troy Baines',
    agent: 'N/A',
    process: 'Resume',
    appliedDate: '2024-02-10',
    status: 'Rejected',
    notes: 'Must be on site'
  }
];