import { supabase } from '../lib/supabase';
import { H1BStatistics, H1BFilters, H1BRecord, PaginatedData } from '../types/h1b';

export interface H1BEmployerStats {
  name: string;
  count: number;
  averageSalary: number;
  certificationRate: number;
}

export interface H1BJobTitleStats {
  jobTitle: string;
  count: number;
  averageSalary: number;
  medianSalary: number;
  minSalary: number;
  maxSalary: number;
}

export interface H1BTrendData {
  period: string;
  totalApplications: number;
  certifiedApplications: number;
  certificationRate: number;
  averageSalary: number;
}

export interface H1BStateStats {
  state: string;
  totalApplications: number;
  averageSalary: number;
  certificationRate: number;
  topEmployer: string;
}

export class H1BStatisticsService {
  /**
   * Get unique employers for dropdown population
   */
  static async getUniqueEmployers(limit: number = 50): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_h1b_unique_employers', {
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching unique employers:', error);
        throw new Error(`Failed to fetch unique employers: ${error.message}`);
      }

      // Handle error response from function
      if (data?.error) {
        throw new Error(data.message || 'Failed to fetch unique employers');
      }

      return data || [];
    } catch (error) {
      console.error('Unique employers service error:', error);
      throw error;
    }
  }

  /**
   * Get unique case statuses for dropdown population
   */
  static async getUniqueStatuses(): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_h1b_unique_statuses');

      if (error) {
        console.error('Error fetching unique statuses:', error);
        throw new Error(`Failed to fetch unique statuses: ${error.message}`);
      }

      // Handle error response from function
      if (data?.error) {
        throw new Error(data.message || 'Failed to fetch unique statuses');
      }

      return data || [];
    } catch (error) {
      console.error('Unique statuses service error:', error);
      throw error;
    }
  }

  /**
   * Get unique job titles for dropdown population
   */
  static async getUniqueJobTitles(limit: number = 30): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_h1b_unique_job_titles', {
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching unique job titles:', error);
        throw new Error(`Failed to fetch unique job titles: ${error.message}`);
      }

      // Handle error response from function
      if (data?.error) {
        throw new Error(data.message || 'Failed to fetch unique job titles');
      }

      return data || [];
    } catch (error) {
      console.error('Unique job titles service error:', error);
      throw error;
    }
  }

  /**
   * Get filtered H1B applications with pagination
   */
  static async getFilteredApplications(
    filters: Partial<H1BFilters> = {},
    pageSize: number = 20,
    pageNumber: number = 1
  ): Promise<PaginatedData<H1BRecord>> {
    try {
      // Validate filters first
      const validation = this.validateFilters(filters);
      if (!validation.valid) {
        throw new Error(`Invalid filters: ${validation.errors.join(', ')}`);
      }

      const { data, error } = await supabase.rpc('get_h1b_filtered_applications', {
        filters: filters,
        page_size: pageSize,
        page_number: pageNumber
      });

      if (error) {
        console.error('Error fetching filtered applications:', error);
        throw new Error(`Failed to fetch filtered applications: ${error.message}`);
      }

      // Handle error response from function
      if (data?.error) {
        throw new Error(data.message || 'Failed to fetch filtered applications');
      }

      // Transform the response to match PaginatedData interface
      const result: PaginatedData<H1BRecord> = {
        data: data?.data || [],
        totalRecords: data?.pagination?.totalRecords || 0,
        totalPages: data?.pagination?.totalPages || 0,
        currentPage: data?.pagination?.currentPage || 1,
        pageSize: data?.pagination?.pageSize || pageSize,
        hasNextPage: data?.pagination?.hasNextPage || false,
        hasPreviousPage: data?.pagination?.hasPreviousPage || false
      };

      return result;
    } catch (error) {
      console.error('Filtered applications service error:', error);
      throw error;
    }
  }

  /**
   * Get unique values for a specific field (generic helper)
   */
  static async getUniqueValues(field: string, limit?: number): Promise<string[]> {
    switch (field) {
      case 'employer_name':
      case 'employer':
        return this.getUniqueEmployers(limit || 50);
      case 'case_status':
      case 'status':
        return this.getUniqueStatuses();
      case 'job_title':
      case 'jobTitle':
        return this.getUniqueJobTitles(limit || 30);
      default:
        console.warn(`Unknown field for unique values: ${field}`);
        return [];
    }
  }
  /**
   * Get comprehensive H1B statistics with optional filters
   */
  static async getStatistics(filters?: Partial<H1BFilters>): Promise<H1BStatistics> {
    try {
      let data;
      let error;

      if (filters?.employer) {
        // Use employer-specific function
        const result = await supabase.rpc('get_h1b_stats_by_employer', {
          p_employer: filters.employer
        });
        data = result.data;
        error = result.error;
        
        // Transform employer-specific response to match H1BStatistics interface
        if (data && !error) {
          data = {
            totalApplications: data.totalApplications || 0,
            averageSalary: data.averageSalary || 0,
            medianSalary: data.averageSalary || 0, // Use average as median for now
            minSalary: 0,
            maxSalary: 0,
            certificationRate: data.certificationRate || 0,
            topEmployers: [{ name: filters.employer, count: data.totalApplications || 0 }],
            statusBreakdown: {}
          };
        }
      } else {
        // Use basic statistics function
        const result = await supabase.rpc('get_h1b_basic_stats');
        data = result.data;
        error = result.error;
        
        // Transform basic response to match H1BStatistics interface
        if (data && !error) {
          data = {
            totalApplications: data.totalApplications || 0,
            averageSalary: data.averageSalary || 0,
            medianSalary: data.averageSalary || 0, // Use average as median for now
            minSalary: 0,
            maxSalary: 0,
            certificationRate: data.certificationRate || 0,
            topEmployers: data.topEmployers || [],
            statusBreakdown: {}
          };
        }
      }

      if (error) {
        console.error('Error fetching H1B statistics:', error);
        throw new Error(`Failed to fetch H1B statistics: ${error.message}`);
      }

      return data as H1BStatistics;
    } catch (error) {
      console.error('H1B statistics service error:', error);
      throw error;
    }
  }

  /**
   * Get top employers with pagination and search
   */
  static async getTopEmployers(
    limit: number = 50
  ): Promise<{ data: H1BEmployerStats[]; totalCount: number }> {
    try {
      const { data, error } = await supabase.rpc('get_top_employers', {
        p_limit: limit
      });

      if (error) {
        console.error('Error fetching top employers:', error);
        throw new Error(`Failed to fetch top employers: ${error.message}`);
      }

      // Transform the response to match H1BEmployerStats interface
      const transformedData = (data || []).map((employer: any) => ({
        name: employer.name,
        count: employer.count,
        averageSalary: employer.averageSalary || 0,
        certificationRate: employer.certificationRate || 0
      }));

      return {
        data: transformedData,
        totalCount: transformedData.length
      };
    } catch (error) {
      console.error('Top employers service error:', error);
      throw error;
    }
  }

  /**
   * Get salary statistics by job title (simplified version)
   */
  static async getSalaryByJobTitle(
    jobTitle?: string,
    limit: number = 20
  ): Promise<H1BJobTitleStats[]> {
    try {
      // For now, return mock data since the complex function isn't implemented yet
      // TODO: Implement get_h1b_salary_by_job_title function
      console.warn('getSalaryByJobTitle: Using mock data - implement get_h1b_salary_by_job_title function');
      
      return [
        {
          jobTitle: jobTitle || 'Software Engineer',
          count: 100,
          averageSalary: 150000,
          medianSalary: 145000,
          minSalary: 120000,
          maxSalary: 200000
        }
      ];
    } catch (error) {
      console.error('Salary by job title service error:', error);
      throw error;
    }
  }

  /**
   * Get H1B trends over time
   */
  static async getTrends(
    startDate?: Date,
    endDate?: Date,
    groupBy: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<H1BTrendData[]> {
    try {
      const { data, error } = await supabase.rpc('get_h1b_trends', {
        p_start_date: startDate?.toISOString().split('T')[0] || null,
        p_end_date: endDate?.toISOString().split('T')[0] || null,
        p_group_by: groupBy
      });

      if (error) {
        console.error('Error fetching H1B trends:', error);
        throw new Error(`Failed to fetch H1B trends: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('H1B trends service error:', error);
      throw error;
    }
  }

  /**
   * Get H1B statistics by state
   */
  static async getStatisticsByState(): Promise<H1BStateStats[]> {
    try {
      const { data, error } = await supabase.rpc('get_h1b_statistics_by_state');

      if (error) {
        console.error('Error fetching statistics by state:', error);
        throw new Error(`Failed to fetch statistics by state: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Statistics by state service error:', error);
      throw error;
    }
  }

  /**
   * Get cached statistics (with 5-minute cache)
   */
  static async getCachedStatistics(filters?: Partial<H1BFilters>): Promise<H1BStatistics> {
    const cacheKey = `h1b_stats_${JSON.stringify(filters || {})}`;
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes

    try {
      // Check if we have cached data
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

      if (cachedData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < cacheExpiry) {
          return JSON.parse(cachedData);
        }
      }

      // Fetch fresh data
      const freshData = await this.getStatistics(filters);

      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(freshData));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

      return freshData;
    } catch (error) {
      // If fresh fetch fails, try to return cached data even if expired
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        console.warn('Using expired cached data due to fetch error:', error);
        return JSON.parse(cachedData);
      }
      throw error;
    }
  }

  /**
   * Clear statistics cache
   */
  static clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('h1b_stats_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get quick statistics for dashboard
   */
  static async getQuickStats(): Promise<{
    totalApplications: number;
    averageSalary: number;
    certificationRate: number;
    topEmployer: string;
  }> {
    try {
      const stats = await this.getCachedStatistics();
      
      return {
        totalApplications: stats.totalApplications,
        averageSalary: stats.averageSalary,
        certificationRate: stats.certificationRate,
        topEmployer: stats.topEmployers[0]?.name || 'N/A'
      };
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      return {
        totalApplications: 0,
        averageSalary: 0,
        certificationRate: 0,
        topEmployer: 'N/A'
      };
    }
  }

  /**
   * Validate filters before sending to database
   */
  static validateFilters(filters: Partial<H1BFilters>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filters.minSalary && filters.maxSalary && filters.minSalary > filters.maxSalary) {
      errors.push('Minimum salary cannot be greater than maximum salary');
    }

    if (filters.minSalary && filters.minSalary < 0) {
      errors.push('Minimum salary cannot be negative');
    }

    if (filters.maxSalary && filters.maxSalary < 0) {
      errors.push('Maximum salary cannot be negative');
    }

    if (filters.searchTerm && filters.searchTerm.length > 100) {
      errors.push('Search term is too long (maximum 100 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get statistics with error handling and retries
   */
  static async getStatisticsWithRetry(
    filters?: Partial<H1BFilters>,
    maxRetries: number = 3
  ): Promise<H1BStatistics> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.getStatistics(filters);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`H1B statistics fetch attempt ${attempt} failed, retrying...`);
        }
      }
    }

    throw lastError!;
  }
}

export default H1BStatisticsService;