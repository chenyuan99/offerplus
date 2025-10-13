import { supabase } from '../lib/supabase';
import { H1BFilters, H1BRecord, PaginatedData, H1BStatistics } from '../types/h1b';

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

/**
 * Optimized H1B service with performance improvements
 */
export class H1BOptimizedService {
  private static cache: QueryCache = {};
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly TABLE_NAME = 'h1b_applications';
  private static abortController: AbortController | null = null;

  /**
   * Get filtered applications with aggressive optimization
   */
  static async getFilteredApplicationsOptimized(
    filters: Partial<H1BFilters> = {},
    pageSize: number = 20,
    pageNumber: number = 1
  ): Promise<PaginatedData<H1BRecord>> {
    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      // Check cache first
      const cacheKey = this.getCacheKey('filtered', filters, pageSize, pageNumber);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Build optimized query
      let query = supabase
        .from(this.TABLE_NAME)
        .select(`
          id,
          case_number,
          case_status,
          job_title,
          employer_name,
          wage_rate_of_pay_from,
          wage_rate_of_pay_to,
          received_date,
          decision_date,
          employer_city,
          employer_state,
          worksite_city,
          worksite_state
        `, { count: 'exact' })
        .abortSignal(this.abortController.signal);

      // Apply filters with optimized conditions
      query = this.applyOptimizedFilters(query, filters);

      // Apply pagination
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;

      // Execute with optimizations
      const { data, error, count } = await query
        .order('id', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      const result: PaginatedData<H1BRecord> = {
        data: data || [],
        totalRecords: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: pageNumber,
        pageSize,
        hasNextPage: pageNumber < Math.ceil((count || 0) / pageSize),
        hasPreviousPage: pageNumber > 1
      };

      // Cache result
      this.setCache(cacheKey, result);
      return result;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    }
  }

  /**
   * Apply optimized filters to query
   */
  private static applyOptimizedFilters(query: any, filters: Partial<H1BFilters>) {
    // Use indexed columns first for better performance
    
    // Status filter (exact match, very fast with index)
    if (filters.status?.trim()) {
      query = query.eq('case_status', filters.status.trim());
    }

    // Employer filter (use index-friendly approach)
    if (filters.employer?.trim()) {
      const employer = filters.employer.trim();
      // For exact matches, use eq (fastest)
      if (employer.length > 10) {
        query = query.ilike('employer_name', `%${employer}%`);
      } else {
        // For short terms, use starts with (faster than contains)
        query = query.ilike('employer_name', `${employer}%`);
      }
    }

    // Job title filter (optimized for common searches)
    if (filters.jobTitle?.trim()) {
      const jobTitle = filters.jobTitle.trim();
      query = query.ilike('job_title', `%${jobTitle}%`);
    }

    // Salary filters (use range queries for better index usage)
    if (filters.minSalary !== null && filters.minSalary !== undefined && filters.minSalary > 0) {
      query = query.gte('wage_rate_of_pay_from', filters.minSalary);
    }

    if (filters.maxSalary !== null && filters.maxSalary !== undefined && filters.maxSalary > 0) {
      query = query.lte('wage_rate_of_pay_from', filters.maxSalary);
    }

    // Text search (most expensive, apply last)
    if (filters.searchTerm?.trim()) {
      const searchTerm = filters.searchTerm.trim();
      // Limit search scope for performance
      if (searchTerm.length >= 3) {
        query = query.or(`employer_name.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%`);
      }
    }

    return query;
  }

  /**
   * Get unique values with aggressive caching
   */
  static async getUniqueValuesOptimized(field: string, limit: number = 50): Promise<string[]> {
    const cacheKey = this.getCacheKey('unique', { field, limit });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select(field)
        .not(field, 'is', null)
        .neq(field, '');

      // Use different strategies based on field
      if (field === 'employer_name') {
        // Get top employers by frequency (requires aggregation)
        const { data, error } = await supabase
          .rpc('get_top_employers_fast', { limit_count: limit });
        
        if (error) throw error;
        const result = (data || []).map((item: any) => item.name);
        this.setCache(cacheKey, result, 10 * 60 * 1000); // Cache for 10 minutes
        return result;
      } else {
        // Simple distinct query for other fields
        const { data, error } = await query.limit(limit * 2); // Get more to ensure uniqueness
        
        if (error) throw error;
        
        const uniqueValues = [...new Set(
          (data || [])
            .map(item => item[field])
            .filter(value => value && typeof value === 'string' && value.trim() !== '')
        )].sort().slice(0, limit);

        this.setCache(cacheKey, uniqueValues);
        return uniqueValues;
      }
    } catch (error) {
      console.error(`Error fetching unique ${field} values:`, error);
      return [];
    }
  }

  /**
   * Get lightweight statistics (only essential metrics)
   */
  static async getLightweightStats(filters: Partial<H1BFilters> = {}): Promise<Partial<H1BStatistics>> {
    const cacheKey = this.getCacheKey('stats', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use RPC function for better performance
      const { data, error } = await supabase.rpc('get_h1b_basic_stats_fast', {
        filters: JSON.stringify(filters)
      });

      if (error) {
        // Fallback to simple count query
        let query = supabase
          .from(this.TABLE_NAME)
          .select('case_status', { count: 'exact', head: true });

        query = this.applyOptimizedFilters(query, filters);
        const { count } = await query;

        const result = {
          totalApplications: count || 0,
          averageSalary: 0,
          certificationRate: 0,
          topEmployers: [],
          statusBreakdown: {}
        };

        this.setCache(cacheKey, result, 2 * 60 * 1000); // Cache for 2 minutes
        return result;
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching lightweight stats:', error);
      return {
        totalApplications: 0,
        averageSalary: 0,
        certificationRate: 0,
        topEmployers: [],
        statusBreakdown: {}
      };
    }
  }

  /**
   * Cache management
   */
  private static getCacheKey(type: string, ...args: any[]): string {
    return `${type}_${JSON.stringify(args)}`;
  }

  private static getFromCache(key: string): any {
    const cached = this.cache[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    delete this.cache[key];
    return null;
  }

  private static setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Clean old cache entries
    this.cleanCache();
  }

  private static cleanCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      const cached = this.cache[key];
      if (now - cached.timestamp > cached.ttl) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    this.cache = {};
  }

  /**
   * Cancel ongoing requests
   */
  static cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Fast RPC functions (to be created in Supabase)
export const FAST_RPC_FUNCTIONS = `
-- Fast top employers function
CREATE OR REPLACE FUNCTION get_top_employers_fast(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(name TEXT, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    employer_name as name,
    COUNT(*) as count
  FROM h1b_applications
  WHERE employer_name IS NOT NULL 
    AND employer_name != ''
  GROUP BY employer_name
  ORDER BY COUNT(*) DESC
  LIMIT limit_count;
$$;

-- Fast basic stats function
CREATE OR REPLACE FUNCTION get_h1b_basic_stats_fast(filters JSONB DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
  total_count INTEGER;
BEGIN
  -- Simple count query for now
  SELECT COUNT(*) INTO total_count FROM h1b_applications;
  
  result := jsonb_build_object(
    'totalApplications', total_count,
    'averageSalary', 0,
    'certificationRate', 0,
    'topEmployers', '[]'::jsonb,
    'statusBreakdown', '{}'::jsonb
  );
  
  RETURN result;
END;
$$;
`;