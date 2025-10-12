// H1B Data Types
export interface H1BRecord {
  id?: number;
  case_number: string;
  case_status: string;
  received_date?: string;
  decision_date?: string;
  visa_class?: string;
  job_title: string;
  soc_code?: string;
  soc_title?: string;
  full_time_position?: string;
  begin_date?: string;
  end_date?: string;
  employer_name: string;
  employer_city?: string;
  employer_state?: string;
  employer_postal_code?: string;
  worksite_city?: string;
  worksite_state?: string;
  worksite_postal_code?: string;
  wage_rate_of_pay_from?: number;
  wage_rate_of_pay_to?: number;
  wage_unit_of_pay?: string;
  prevailing_wage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface H1BFilters {
  employer: string;
  status: string;
  jobTitle: string;
  minSalary: number | null;
  maxSalary: number | null;
  searchTerm: string;
}

export interface H1BStatistics {
  totalApplications: number;
  averageSalary: number;
  medianSalary: number;
  minSalary: number;
  maxSalary: number;
  topEmployers: Array<{ name: string; count: number }>;
  statusBreakdown: Record<string, number>;
  certificationRate: number;
}

export interface PaginatedData<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: string | null;
  direction: SortDirection;
}