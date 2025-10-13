import { useState, useEffect, useCallback, useMemo } from 'react';
import { H1BFilters, H1BRecord, PaginatedData, H1BStatistics } from '../types/h1b';
import { H1BNativeFilterService, H1BFilterOptions } from '../services/h1bNativeFilterService';

interface UseH1BNativeFiltersOptions {
  initialFilters?: Partial<H1BFilters>;
  initialPageSize?: number;
  autoFetch?: boolean;
  debounceMs?: number;
}

interface UseH1BNativeFiltersReturn {
  // Data
  data: H1BRecord[];
  paginatedData: PaginatedData<H1BRecord> | null;
  statistics: H1BStatistics | null;
  uniqueValues: {
    employers: string[];
    statuses: string[];
    jobTitles: string[];
  };

  // State
  loading: boolean;
  error: string | null;
  filters: H1BFilters;

  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;

  // Actions
  updateFilters: (newFilters: Partial<H1BFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
  exportAllData: () => Promise<H1BRecord[]>;

  // Utilities
  getUniqueValues: (field: string, limit?: number) => Promise<string[]>;
}

/**
 * Hook for H1B data filtering using native Supabase queries
 * Provides efficient server-side filtering, pagination, and statistics
 */
export function useH1BNativeFilters(options: UseH1BNativeFiltersOptions = {}): UseH1BNativeFiltersReturn {
  const {
    initialFilters = {},
    initialPageSize = 20,
    autoFetch = true,
    debounceMs = 300
  } = options;

  // State
  const [paginatedData, setPaginatedData] = useState<PaginatedData<H1BRecord> | null>(null);
  const [statistics, setStatistics] = useState<H1BStatistics | null>(null);
  const [uniqueValues, setUniqueValues] = useState({
    employers: [] as string[],
    statuses: [] as string[],
    jobTitles: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Filters state
  const [filters, setFilters] = useState<H1BFilters>(() => ({
    employer: '',
    status: '',
    jobTitle: '',
    minSalary: null,
    maxSalary: null,
    searchTerm: '',
    ...initialFilters
  }));

  // Fetch filtered data
  const fetchData = useCallback(async (
    filtersToUse: Partial<H1BFilters> = filters,
    page: number = currentPage,
    size: number = pageSize
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Validate filters
      const validation = H1BNativeFilterService.validateFilters(filtersToUse);
      if (!validation.valid) {
        throw new Error(`Invalid filters: ${validation.errors.join(', ')}`);
      }

      const options: H1BFilterOptions = {
        pageSize: size,
        pageNumber: page,
        sortBy: 'id',
        sortOrder: 'desc'
      };

      // Fetch paginated data and statistics in parallel
      const [paginatedResult, statisticsResult] = await Promise.all([
        H1BNativeFilterService.getFilteredApplications(filtersToUse, options),
        H1BNativeFilterService.getFilteredStatistics(filtersToUse)
      ]);

      setPaginatedData(paginatedResult);
      setStatistics(statisticsResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch H1B data';
      setError(errorMessage);
      console.error('H1B native filters error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  // Debounced fetch for filter changes
  const debouncedFetch = useCallback((
    filtersToUse: Partial<H1BFilters>,
    page: number = 1,
    size: number = pageSize
  ) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      fetchData(filtersToUse, page, size);
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [debounceTimeout, debounceMs, fetchData, pageSize]);

  // Load unique values for dropdowns
  const loadUniqueValues = useCallback(async () => {
    try {
      const [employers, statuses, jobTitles] = await Promise.all([
        H1BNativeFilterService.getUniqueEmployers(50),
        H1BNativeFilterService.getUniqueStatuses(),
        H1BNativeFilterService.getUniqueJobTitles(30)
      ]);

      setUniqueValues({
        employers,
        statuses,
        jobTitles
      });
    } catch (err) {
      console.error('Error loading unique values:', err);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<H1BFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1); // Reset to first page
    debouncedFetch(updatedFilters, 1, pageSize);
  }, [filters, debouncedFetch, pageSize]);

  // Clear filters
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
    fetchData(clearedFilters, 1, pageSize);
  }, [fetchData, pageSize]);

  // Set page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchData(filters, page, pageSize);
  }, [fetchData, filters, pageSize]);

  // Set page size
  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    fetchData(filters, 1, size);
  }, [fetchData, filters]);

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchData(filters, currentPage, pageSize);
    await loadUniqueValues();
  }, [fetchData, loadUniqueValues, filters, currentPage, pageSize]);

  // Get unique values for any field
  const getUniqueValues = useCallback(async (field: string, limit?: number): Promise<string[]> => {
    try {
      return await H1BNativeFilterService.getUniqueValues(field, limit);
    } catch (error) {
      console.error(`Error fetching unique values for ${field}:`, error);
      return [];
    }
  }, []);

  // Export all filtered data
  const exportAllData = useCallback(async (): Promise<H1BRecord[]> => {
    try {
      console.log('Exporting all filtered data with current filters:', filters);
      return await H1BNativeFilterService.exportAllFilteredData(filters);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [filters]);

  // Computed values
  const data = useMemo(() => paginatedData?.data || [], [paginatedData]);
  const totalPages = useMemo(() => paginatedData?.totalPages || 0, [paginatedData]);
  const totalRecords = useMemo(() => paginatedData?.totalRecords || 0, [paginatedData]);

  // Initial data load
  useEffect(() => {
    if (autoFetch) {
      fetchData();
      loadUniqueValues();
    }
  }, []); // Only run on mount

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return {
    // Data
    data,
    paginatedData,
    statistics,
    uniqueValues,

    // State
    loading,
    error,
    filters,

    // Pagination
    currentPage,
    pageSize,
    totalPages,
    totalRecords,

    // Actions
    updateFilters,
    clearFilters,
    setPage,
    setPageSize: setPageSizeHandler,
    refresh,
    exportAllData,

    // Utilities
    getUniqueValues
  };
}

/**
 * Simplified hook for just getting unique values
 */
export function useH1BUniqueValues() {
  const [uniqueValues, setUniqueValues] = useState({
    employers: [] as string[],
    statuses: [] as string[],
    jobTitles: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadValues = async () => {
      try {
        setLoading(true);
        setError(null);

        const [employers, statuses, jobTitles] = await Promise.all([
          H1BNativeFilterService.getUniqueEmployers(50),
          H1BNativeFilterService.getUniqueStatuses(),
          H1BNativeFilterService.getUniqueJobTitles(30)
        ]);

        setUniqueValues({
          employers,
          statuses,
          jobTitles
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load unique values';
        setError(errorMessage);
        console.error('Error loading unique values:', err);
      } finally {
        setLoading(false);
      }
    };

    loadValues();
  }, []);

  return {
    uniqueValues,
    loading,
    error
  };
}