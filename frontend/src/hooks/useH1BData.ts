import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { H1BRecord, H1BFilters, H1BStatistics, PaginatedData, SortConfig } from '../types/h1b';
import { H1BStatisticsService } from '../services/h1bStatisticsService';

const TABLE_NAME = 'h1b_applications';

export function useH1BData() {
  const [paginatedData, setPaginatedData] = useState<PaginatedData<H1BRecord> | null>(null);
  const [statistics, setStatistics] = useState<H1BStatistics | null>(null);
  const [uniqueValues, setUniqueValues] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<H1BFilters>({
    employer: '',
    status: '',
    jobTitle: '',
    minSalary: null,
    maxSalary: null,
    searchTerm: ''
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Fetch filtered data using Supabase functions
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch filtered applications using the new function
      const filteredApplications = await H1BStatisticsService.getFilteredApplications(
        filters,
        pageSize,
        currentPage
      );

      // Fetch statistics
      const stats = await H1BStatisticsService.getStatistics(filters);

      setPaginatedData(filteredApplications);
      setStatistics(stats);

      console.log(`✅ Successfully loaded ${filteredApplications.data.length} H1B records (page ${currentPage})`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load H1B data';
      console.error('❌ Error fetching H1B data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, currentPage]);

  // Apply filters (now triggers server-side filtering)
  const applyFilters = useCallback((newFilters: Partial<H1BFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters]);

  // Apply sorting (client-side for now, could be moved to server)
  const applySorting = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    // Note: Sorting is currently applied client-side to the current page
    // For true server-side sorting, we would need to modify the Supabase function
  }, []);

  // Get paginated data (now returns server-side paginated data)
  const getPaginatedData = useCallback((page: number = 1, newPageSize: number = 50): PaginatedData<H1BRecord> => {
    // Update page and pageSize if they changed
    if (page !== currentPage) {
      setCurrentPage(page);
    }
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset to first page when page size changes
    }

    // Return current paginated data or empty structure
    return paginatedData || {
      data: [],
      totalRecords: 0,
      totalPages: 0,
      currentPage: page,
      pageSize: newPageSize,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }, [paginatedData, currentPage, pageSize]);

  // Get statistics (now from server-side calculation)
  const getStatistics = useMemo((): H1BStatistics => {
    return statistics || {
      totalApplications: 0,
      averageSalary: 0,
      medianSalary: 0,
      minSalary: 0,
      maxSalary: 0,
      topEmployers: [],
      statusBreakdown: {},
      certificationRate: 0
    };
  }, [statistics]);

  // Get unique values for filters (now from server-side functions)
  const getUniqueValues = useCallback(async (field: keyof H1BRecord, limit?: number): Promise<string[]> => {
    const cacheKey = `${field}_${limit || 'all'}`;
    
    // Return cached values if available
    if (uniqueValues[cacheKey]) {
      return uniqueValues[cacheKey];
    }

    try {
      const values = await H1BStatisticsService.getUniqueValues(field as string, limit);
      
      // Cache the values
      setUniqueValues(prev => ({
        ...prev,
        [cacheKey]: values
      }));
      
      return values;
    } catch (error) {
      console.error(`Error fetching unique values for ${field}:`, error);
      return [];
    }
  }, [uniqueValues]);

  // Synchronous version for backward compatibility
  const getUniqueValuesSync = useCallback((field: keyof H1BRecord, limit?: number): string[] => {
    const cacheKey = `${field}_${limit || 'all'}`;
    return uniqueValues[cacheKey] || [];
  }, [uniqueValues]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: H1BFilters = {
      employer: '',
      status: '',
      jobTitle: '',
      minSalary: null,
      maxSalary: null,
      searchTerm: ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
  }, []);

  // Load unique values on mount
  useEffect(() => {
    const loadUniqueValues = async () => {
      try {
        const [employers, statuses, jobTitles] = await Promise.all([
          H1BStatisticsService.getUniqueEmployers(50),
          H1BStatisticsService.getUniqueStatuses(),
          H1BStatisticsService.getUniqueJobTitles(30)
        ]);

        setUniqueValues({
          'employer_name_50': employers,
          'employer_50': employers,
          'case_status_all': statuses,
          'status_all': statuses,
          'job_title_30': jobTitles,
          'jobTitle_30': jobTitles
        });
      } catch (error) {
        console.error('Error loading unique values:', error);
      }
    };

    loadUniqueValues();
  }, []);

  // Load data when filters, page, or pageSize change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: paginatedData?.data || [],
    loading,
    error,
    filters,
    sortConfig,
    statistics: getStatistics,
    applyFilters,
    applySorting,
    getPaginatedData,
    getUniqueValues: getUniqueValuesSync, // Backward compatible sync version
    getUniqueValuesAsync: getUniqueValues, // New async version
    clearFilters,
    refetch: fetchData
  };
}