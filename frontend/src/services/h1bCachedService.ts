import { supabase } from '../lib/supabase';
import { H1BFilters, H1BRecord, PaginatedData, H1BStatistics } from '../types/h1b';
import { h1bCache } from '../lib/indexedDBCache';

export interface H1BFilterOptions {
  pageSize?: number;
  pageNumber?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * H1B Service with IndexedDB caching for lightning-fast filtering
 */
export class H1BCachedService {
  private static readonly TABLE_NAME = 'h1b_applications';
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly MAX_PAGE_SIZE = 100;
  
  // Cache TTL configurations
  private static readonly CACHE_TTL = {
    FILTERED_DATA: 5 * 60 * 1000,      // 5 minutes for filtered data
    UNIQUE_VALUES: 30 * 60 * 1000,     // 30 minutes for unique values
    STATISTICS: 10 * 60 * 1000,        // 10 minutes for statistics
    PREFETCH: 15 * 60 * 1000           // 15 minutes for prefetched data
  };

  /**
   * Get filtered applications with aggressive caching
   */
  static async getFilteredApplications(
    filters: Partial<H1BFilters> = {},
    options: H1BFilterOptions = {}
  ): Promise<PaginatedData<H1BRecord>> {
    const {
      pageSize = this.DEFAULT_PAGE_SIZE,
      pageNumber = 1,
      sortBy = 'id',
      sortOrder = 'desc'
    } = options;

    const validatedPageSize = Math.min(Math.max(1, pageSize), this.MAX_PAGE_SIZE);
    const validatedPageNumber = Math.max(1, pageNumber);

    const cacheParams = {
      filters,
      pageSize: validatedPageSize,
      pageNumber: validatedPageNumber,
      sortBy,
      sortOrder
    };

    try {
      // Try cache first
      const cached = await h1bCache.get<PaginatedData<H1BRecord>>('filtered_apps', cacheParams);
      if (cached) {
        console.log('🎯 Cache HIT for filtered applications');
        return cached;
      }

      console.log('💾 Cache MISS for filtered applications, fetching from database...');

      // Fetch from database
      const result = await this.fetchFromDatabase(filters, {
        pageSize: validatedPageSize,
        pageNumber: validatedPageNumber,
        sortBy,
        sortOrder
      });

      // Cache the result
      await h1bCache.set('filtered_apps', cacheParams, result, this.CACHE_TTL.FILTERED_DATA);

      return result;
    } catch (error) {
      console.error('Error in cached filtered applications:', error);
      
      // Return empty result for database issues
      if (error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('relation') ||
        error.message.includes('does not exist')
      )) {
        return this.getEmptyResult(validatedPageNumber, validatedPageSize);
      }
      
      throw error;
    }
  }

  /**
   * Fetch data from database (without caching logic)
   */
  private static async fetchFromDatabase(
    filters: Partial<H1BFilters>,
    options: Required<H1BFilterOptions>
  ): Promise<PaginatedData<H1BRecord>> {
    // Check if table exists first
    const { count: tableCount, error: countError } = await supabase
      .from(this.TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (countError || !tableCount) {
      console.warn('H1B table not available:', countError?.message);
      return this.getEmptyResult(options.pageNumber, options.pageSize);
    }

    // Build query
    let query = supabase
      .from(this.TABLE_NAME)
      .select('*', { count: 'exact' });

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply sorting and pagination
    query = query
      .order(options.sortBy, { ascending: options.sortOrder === 'asc' })
      .range(
        (options.pageNumber - 1) * options.pageSize,
        options.pageNumber * options.pageSize - 1
      );

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / options.pageSize);

    return {
      data: data || [],
      totalRecords,
      totalPages,
      currentPage: options.pageNumber,
      pageSize: options.pageSize,
      hasNextPage: options.pageNumber < totalPages,
      hasPreviousPage: options.pageNumber > 1
    };
  }

  /**
   * Apply filters to Supabase query
   */
  private static applyFilters(query: any, filters: Partial<H1BFilters>) {
    if (filters.employer?.trim()) {
      query = query.ilike('employer_name', `%${filters.employer.trim()}%`);
    }

    if (filters.status?.trim()) {
      query = query.eq('case_status', filters.status.trim());
    }

    if (filters.jobTitle?.trim()) {
      query = query.ilike('job_title', `%${filters.jobTitle.trim()}%`);
    }

    if (filters.minSalary !== null && filters.minSalary !== undefined && filters.minSalary > 0) {
      query = query.gte('wage_rate_of_pay_from', filters.minSalary);
    }

    if (filters.maxSalary !== null && filters.maxSalary !== undefined && filters.maxSalary > 0) {
      query = query.lte('wage_rate_of_pay_from', filters.maxSalary);
    }

    if (filters.searchTerm?.trim()) {
      const searchTerm = filters.searchTerm.trim();
      query = query.or(`employer_name.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`);
    }

    return query;
  }

  /**
   * Get unique employers with caching
   */
  static async getUniqueEmployers(limit: number = 50): Promise<string[]> {
    const cacheParams = { limit };

    try {
      const cached = await h1bCache.get<string[]>('unique_employers', cacheParams);
      if (cached) {
        console.log('🎯 Cache HIT for unique employers');
        return cached;
      }

      console.log('💾 Cache MISS for unique employers, fetching...');

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('employer_name')
        .not('employer_name', 'is', null)
        .neq('employer_name', '')
        .limit(limit * 2);

      if (error) {
        console.warn('Failed to fetch unique employers:', error);
        return [];
      }

      const uniqueEmployers = [...new Set(
        (data || [])
          .map(item => item.employer_name)
          .filter(name => name && name.trim() !== '')
      )].sort().slice(0, limit);

      await h1bCache.set('unique_employers', cacheParams, uniqueEmployers, this.CACHE_TTL.UNIQUE_VALUES);
      return uniqueEmployers;
    } catch (error) {
      console.error('Error fetching unique employers:', error);
      return [];
    }
  }

  /**
   * Get unique statuses with caching
   */
  static async getUniqueStatuses(): Promise<string[]> {
    const cacheParams = {};

    try {
      const cached = await h1bCache.get<string[]>('unique_statuses', cacheParams);
      if (cached) {
        console.log('🎯 Cache HIT for unique statuses');
        return cached;
      }

      console.log('💾 Cache MISS for unique statuses, fetching...');

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('case_status')
        .not('case_status', 'is', null)
        .neq('case_status', '');

      if (error) {
        console.warn('Failed to fetch unique statuses:', error);
        return [];
      }

      const uniqueStatuses = [...new Set(
        (data || [])
          .map(item => item.case_status)
          .filter(status => status && status.trim() !== '')
      )].sort();

      await h1bCache.set('unique_statuses', cacheParams, uniqueStatuses, this.CACHE_TTL.UNIQUE_VALUES);
      return uniqueStatuses;
    } catch (error) {
      console.error('Error fetching unique statuses:', error);
      return [];
    }
  }

  /**
   * Get unique job titles with caching
   */
  static async getUniqueJobTitles(limit: number = 30): Promise<string[]> {
    const cacheParams = { limit };

    try {
      const cached = await h1bCache.get<string[]>('unique_job_titles', cacheParams);
      if (cached) {
        console.log('🎯 Cache HIT for unique job titles');
        return cached;
      }

      console.log('💾 Cache MISS for unique job titles, fetching...');

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('job_title')
        .not('job_title', 'is', null)
        .neq('job_title', '')
        .limit(limit * 2);

      if (error) {
        console.warn('Failed to fetch unique job titles:', error);
        return [];
      }

      const uniqueJobTitles = [...new Set(
        (data || [])
          .map(item => item.job_title)
          .filter(title => title && title.trim() !== '')
      )].sort().slice(0, limit);

      await h1bCache.set('unique_job_titles', cacheParams, uniqueJobTitles, this.CACHE_TTL.UNIQUE_VALUES);
      return uniqueJobTitles;
    } catch (error) {
      console.error('Error fetching unique job titles:', error);
      return [];
    }
  }

  /**
   * Get statistics with caching
   */
  static async getStatistics(filters: Partial<H1BFilters> = {}): Promise<H1BStatistics> {
    const cacheParams = { filters };

    try {
      const cached = await h1bCache.get<H1BStatistics>('statistics', cacheParams);
      if (cached) {
        console.log('🎯 Cache HIT for statistics');
        return cached;
      }

      console.log('💾 Cache MISS for statistics, calculating...');

      // Fetch sample data for statistics calculation
      let query = supabase
        .from(this.TABLE_NAME)
        .select('case_status, employer_name, wage_rate_of_pay_from, wage_rate_of_pay_to')
        .limit(10000); // Limit for performance

      query = this.applyFilters(query, filters);

      const { data, error } = await query;

      if (error || !data) {
        console.warn('Failed to fetch statistics data:', error);
        return this.getEmptyStatistics();
      }

      const stats = this.calculateStatistics(data);
      await h1bCache.set('statistics', cacheParams, stats, this.CACHE_TTL.STATISTICS);
      
      return stats;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return this.getEmptyStatistics();
    }
  }

  /**
   * Calculate statistics from data
   */
  private static calculateStatistics(data: any[]): H1BStatistics {
    const totalApplications = data.length;

    // Calculate salary statistics
    const salaries = data
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
    data.forEach(record => {
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
    data.forEach(record => {
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
  }

  /**
   * Prefetch common filter combinations
   */
  static async prefetchCommonFilters(): Promise<void> {
    const commonFilters = [
      // Popular employers
      { prefix: 'filtered_apps', params: { filters: { employer: 'Google' }, pageSize: 20, pageNumber: 1 }, fetcher: () => this.fetchFromDatabase({ employer: 'Google' }, { pageSize: 20, pageNumber: 1, sortBy: 'id', sortOrder: 'desc' }) },
      { prefix: 'filtered_apps', params: { filters: { employer: 'Microsoft' }, pageSize: 20, pageNumber: 1 }, fetcher: () => this.fetchFromDatabase({ employer: 'Microsoft' }, { pageSize: 20, pageNumber: 1, sortBy: 'id', sortOrder: 'desc' }) },
      { prefix: 'filtered_apps', params: { filters: { employer: 'Amazon' }, pageSize: 20, pageNumber: 1 }, fetcher: () => this.fetchFromDatabase({ employer: 'Amazon' }, { pageSize: 20, pageNumber: 1, sortBy: 'id', sortOrder: 'desc' }) },
      
      // Popular statuses
      { prefix: 'filtered_apps', params: { filters: { status: 'CERTIFIED' }, pageSize: 20, pageNumber: 1 }, fetcher: () => this.fetchFromDatabase({ status: 'CERTIFIED' }, { pageSize: 20, pageNumber: 1, sortBy: 'id', sortOrder: 'desc' }) },
      
      // Popular job titles
      { prefix: 'filtered_apps', params: { filters: { jobTitle: 'Software Engineer' }, pageSize: 20, pageNumber: 1 }, fetcher: () => this.fetchFromDatabase({ jobTitle: 'Software Engineer' }, { pageSize: 20, pageNumber: 1, sortBy: 'id', sortOrder: 'desc' }) },
      
      // Salary ranges
      { prefix: 'filtered_apps', params: { filters: { minSalary: 100000 }, pageSize: 20, pageNumber: 1 }, fetcher: () => this.fetchFromDatabase({ minSalary: 100000 }, { pageSize: 20, pageNumber: 1, sortBy: 'id', sortOrder: 'desc' }) },
      
      // No filters (default view)
      { prefix: 'filtered_apps', params: { filters: {}, pageSize: 20, pageNumber: 1 }, fetcher: () => this.fetchFromDatabase({}, { pageSize: 20, pageNumber: 1, sortBy: 'id', sortOrder: 'desc' }) }
    ];

    await h1bCache.prefetch(commonFilters);
  }

  /**
   * Clear all cache
   */
  static async clearCache(): Promise<void> {
    await h1bCache.clear();
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    return await h1bCache.getStats();
  }

  /**
   * Export all filtered data (bypasses pagination)
   */
  static async exportAllFilteredData(filters: Partial<H1BFilters> = {}): Promise<H1BRecord[]> {
    const cacheParams = { filters, export: true };

    try {
      // Try cache first for export data
      const cached = await h1bCache.get<H1BRecord[]>('export_data', cacheParams);
      if (cached) {
        console.log('🎯 Cache HIT for export data');
        return cached;
      }

      console.log('💾 Cache MISS for export data, fetching all records...');

      // Check if table exists first
      const { count: tableCount, error: countError } = await supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (countError || !tableCount) {
        console.warn('H1B table not available for export:', countError?.message);
        return [];
      }

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
        throw new Error(`Export query failed: ${error.message}`);
      }

      const exportData = data || [];

      // Cache the export data for 2 minutes (shorter TTL since it's large)
      await h1bCache.set('export_data', cacheParams, exportData, 2 * 60 * 1000);

      return exportData;
    } catch (error) {
      console.error('Error exporting filtered data:', error);
      throw error;
    }
  }

  /**
   * Get empty result structure
   */
  private static getEmptyResult(pageNumber: number, pageSize: number): PaginatedData<H1BRecord> {
    return {
      data: [],
      totalRecords: 0,
      totalPages: 0,
      currentPage: pageNumber,
      pageSize: pageSize,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  /**
   * Get empty statistics
   */
  private static getEmptyStatistics(): H1BStatistics {
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
}

// Initialize prefetching on module load (with delay to not block initial load)
setTimeout(() => {
  H1BCachedService.prefetchCommonFilters().catch(console.error);
}, 2000);