import { supabase } from '../lib/supabase';
import { H1BFilters, H1BRecord, PaginatedData, H1BStatistics } from '../types/h1b';

export interface H1BFilterOptions {
  pageSize?: number;
  pageNumber?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Native Supabase filtering service for H1B applications
 * Uses Supabase's built-in filtering capabilities for optimal performance
 */
export class H1BNativeFilterService {
  private static readonly TABLE_NAME = 'h1b_applications';
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly MAX_PAGE_SIZE = 100;

  /**
   * Get filtered H1B applications using native Supabase filtering
   */
  static async getFilteredApplications(
    filters: Partial<H1BFilters> = {},
    options: H1BFilterOptions = {}
  ): Promise<PaginatedData<H1BRecord>> {
    try {
      const {
        pageSize = this.DEFAULT_PAGE_SIZE,
        pageNumber = 1,
        sortBy = 'id',
        sortOrder = 'desc'
      } = options;

      // Validate and sanitize inputs
      const validatedPageSize = Math.min(Math.max(1, pageSize), this.MAX_PAGE_SIZE);
      const validatedPageNumber = Math.max(1, pageNumber);

      // Build base query
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' });

      // Apply filters using Supabase's native filtering API
      query = this.applyFilters(query, filters);

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (validatedPageNumber - 1) * validatedPageSize;
      const to = from + validatedPageSize - 1;
      query = query.range(from, to);

      // Execute query with timeout protection
      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching filtered applications:', error);
        
        // Handle specific timeout or table not found errors gracefully
        if (error.message.includes('timeout') || 
            error.message.includes('canceling statement') ||
            error.message.includes('relation') ||
            error.message.includes('does not exist')) {
          console.warn('Database issue detected, returning empty result:', error.message);
          return {
            data: [],
            totalRecords: 0,
            totalPages: 0,
            currentPage: validatedPageNumber,
            pageSize: validatedPageSize,
            hasNextPage: false,
            hasPreviousPage: false
          };
        }
        
        throw new Error(`Failed to fetch filtered applications: ${error.message}`);
      }

      // Calculate pagination metadata
      const totalRecords = count || 0;
      const totalPages = Math.ceil(totalRecords / validatedPageSize);

      return {
        data: data || [],
        totalRecords,
        totalPages,
        currentPage: validatedPageNumber,
        pageSize: validatedPageSize,
        hasNextPage: validatedPageNumber < totalPages,
        hasPreviousPage: validatedPageNumber > 1
      };
    } catch (error) {
      console.error('Native filter service error:', error);
      throw error;
    }
  }

  /**
   * Apply filters to a Supabase query using native filtering
   */
  private static applyFilters(query: any, filters: Partial<H1BFilters>) {
    // Employer filter (case-insensitive partial match)
    if (filters.employer && filters.employer.trim()) {
      query = query.ilike('employer_name', `%${filters.employer.trim()}%`);
    }

    // Status filter (exact match)
    if (filters.status && filters.status.trim()) {
      query = query.eq('case_status', filters.status.trim());
    }

    // Job title filter (case-insensitive partial match)
    if (filters.jobTitle && filters.jobTitle.trim()) {
      query = query.ilike('job_title', `%${filters.jobTitle.trim()}%`);
    }

    // Salary range filters
    if (filters.minSalary !== null && filters.minSalary !== undefined && filters.minSalary > 0) {
      // Check either wage_rate_of_pay_from or wage_rate_of_pay_to
      query = query.or(`wage_rate_of_pay_from.gte.${filters.minSalary},wage_rate_of_pay_to.gte.${filters.minSalary}`);
    }

    if (filters.maxSalary !== null && filters.maxSalary !== undefined && filters.maxSalary > 0) {
      // Check either wage_rate_of_pay_from or wage_rate_of_pay_to
      query = query.or(`wage_rate_of_pay_from.lte.${filters.maxSalary},wage_rate_of_pay_to.lte.${filters.maxSalary}`);
    }

    // Text search across multiple fields
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.trim();
      query = query.or(`employer_name.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`);
    }

    return query;
  }

  /**
   * Get unique employers using native Supabase query
   */
  static async getUniqueEmployers(limit: number = 50): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('employer_name')
        .not('employer_name', 'is', null)
        .neq('employer_name', '')
        .limit(limit * 2); // Get more to ensure uniqueness after filtering

      if (error) {
        console.error('Error fetching unique employers:', error);
        throw new Error(`Failed to fetch unique employers: ${error.message}`);
      }

      // Extract unique values and sort by frequency (simplified)
      const uniqueEmployers = [...new Set(
        (data || [])
          .map(item => item.employer_name)
          .filter(name => name && name.trim() !== '')
      )].sort().slice(0, limit);

      return uniqueEmployers;
    } catch (error) {
      console.error('Native unique employers error:', error);
      
      // Return empty array instead of throwing for better UX
      if (error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('canceling statement') ||
        error.message.includes('relation') ||
        error.message.includes('does not exist')
      )) {
        console.warn('Returning empty employers due to database issue:', error.message);
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Get unique case statuses using native Supabase query
   */
  static async getUniqueStatuses(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('case_status')
        .not('case_status', 'is', null)
        .neq('case_status', '')
        .order('case_status');

      if (error) {
        console.error('Error fetching unique statuses:', error);
        throw new Error(`Failed to fetch unique statuses: ${error.message}`);
      }

      // Get unique values
      const uniqueStatuses = [...new Set((data || []).map(item => item.case_status))];
      return uniqueStatuses.sort();
    } catch (error) {
      console.error('Native unique statuses error:', error);
      
      // Return empty array instead of throwing for better UX
      if (error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('canceling statement') ||
        error.message.includes('relation') ||
        error.message.includes('does not exist')
      )) {
        console.warn('Returning empty statuses due to database issue:', error.message);
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Get unique job titles using native Supabase query
   */
  static async getUniqueJobTitles(limit: number = 30): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('job_title')
        .not('job_title', 'is', null)
        .neq('job_title', '')
        .limit(limit * 2); // Get more to ensure uniqueness after filtering

      if (error) {
        console.error('Error fetching unique job titles:', error);
        throw new Error(`Failed to fetch unique job titles: ${error.message}`);
      }

      // Extract unique values and sort by frequency (simplified)
      const uniqueJobTitles = [...new Set(
        (data || [])
          .map(item => item.job_title)
          .filter(title => title && title.trim() !== '')
      )].sort().slice(0, limit);

      return uniqueJobTitles;
    } catch (error) {
      console.error('Native unique job titles error:', error);
      
      // Return empty array instead of throwing for better UX
      if (error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('canceling statement') ||
        error.message.includes('relation') ||
        error.message.includes('does not exist')
      )) {
        console.warn('Returning empty job titles due to database issue:', error.message);
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Get statistics for filtered data using native Supabase aggregation
   */
  static async getFilteredStatistics(filters: Partial<H1BFilters> = {}): Promise<H1BStatistics> {
    try {
      // Build query for statistics
      let query = supabase
        .from(this.TABLE_NAME)
        .select(`
          case_status,
          employer_name,
          wage_rate_of_pay_from,
          wage_rate_of_pay_to
        `);

      // Apply same filters as main query
      query = this.applyFilters(query, filters);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered statistics:', error);
        throw new Error(`Failed to fetch filtered statistics: ${error.message}`);
      }

      // Calculate statistics from filtered data
      const records = data || [];
      const totalApplications = records.length;

      // Calculate salary statistics
      const salaries = records
        .map(record => record.wage_rate_of_pay_from || record.wage_rate_of_pay_to)
        .filter((salary): salary is number => salary != null && salary > 0)
        .sort((a, b) => a - b);

      const averageSalary = salaries.length > 0
        ? Math.round(salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length)
        : 0;

      const medianSalary = salaries.length > 0
        ? salaries[Math.floor(salaries.length / 2)]
        : 0;

      // Calculate top employers
      const employerCounts: Record<string, number> = {};
      records.forEach(record => {
        if (record.employer_name) {
          employerCounts[record.employer_name] = (employerCounts[record.employer_name] || 0) + 1;
        }
      });

      const topEmployers = Object.entries(employerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Calculate status breakdown
      const statusBreakdown: Record<string, number> = {};
      records.forEach(record => {
        const status = record.case_status || 'Unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      // Calculate certification rate
      const certifiedStatuses = ['CERTIFIED', 'CERTIFIED-WITHDRAWN'];
      const certifiedCount = Object.entries(statusBreakdown)
        .filter(([status]) => certifiedStatuses.includes(status))
        .reduce((sum, [, count]) => sum + count, 0);

      const certificationRate = totalApplications > 0
        ? Math.round((certifiedCount / totalApplications) * 100)
        : 0;

      return {
        totalApplications,
        averageSalary,
        medianSalary,
        minSalary: salaries.length > 0 ? salaries[0] : 0,
        maxSalary: salaries.length > 0 ? salaries[salaries.length - 1] : 0,
        topEmployers,
        statusBreakdown,
        certificationRate
      };
    } catch (error) {
      console.error('Native statistics error:', error);
      
      // Return empty statistics instead of throwing for better UX
      if (error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('canceling statement') ||
        error.message.includes('relation') ||
        error.message.includes('does not exist')
      )) {
        console.warn('Returning empty statistics due to database issue:', error.message);
        return {
          totalApplications: 0,
          averageSalary: 0,
          medianSalary: 0,
          minSalary: 0,
          maxSalary: 0,
          topEmployers: [],
          statusBreakdown: {},
          certificationRate: 0
        };
      }
      
      throw error;
    }
  }

  /**
   * Get unique values for any field using native Supabase query
   */
  static async getUniqueValues(field: string, limit?: number): Promise<string[]> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select(field)
        .not(field, 'is', null)
        .neq(field, '');

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching unique ${field} values:`, error);
        throw new Error(`Failed to fetch unique ${field} values: ${error.message}`);
      }

      // Extract unique values
      const uniqueValues = [...new Set(
        (data || [])
          .map((item: any) => item[field])
          .filter(value => value && typeof value === 'string' && value.trim() !== '')
      )].sort();

      return uniqueValues;
    } catch (error) {
      console.error(`Native unique values error for ${field}:`, error);
      throw error;
    }
  }

  /**
   * Export all filtered data (bypasses pagination)
   */
  static async exportAllFilteredData(filters: Partial<H1BFilters> = {}): Promise<H1BRecord[]> {
    try {
      console.log('Exporting all filtered H1B data...');

      // Build query for all data (no pagination)
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .limit(50000); // Safety limit to prevent memory issues

      // Apply filters
      query = this.applyFilters(query, filters);

      // Order by ID for consistent results
      query = query.order('id', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error exporting filtered data:', error);
        
        // Handle specific timeout or table not found errors gracefully
        if (error.message.includes('timeout') || 
            error.message.includes('canceling statement') ||
            error.message.includes('relation') ||
            error.message.includes('does not exist')) {
          console.warn('Database issue detected during export:', error.message);
          return [];
        }
        
        throw new Error(`Export query failed: ${error.message}`);
      }

      console.log(`Successfully exported ${(data || []).length} records`);
      return data || [];
    } catch (error) {
      console.error('Native export error:', error);
      throw error;
    }
  }

  /**
   * Validate filter inputs
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
}