import { useState, useEffect, useCallback, useMemo } from 'react';
import { H1BFilters, H1BRecord, PaginatedData, H1BStatistics } from '../types/h1b';
import { H1BCachedService, H1BFilterOptions } from '../services/h1bCachedService';

interface UseH1BCachedOptions {
  initialFilters?: Partial<H1BFilters>;
  initialPageSize?: number;
  debounceMs?: number;
  enablePrefetch?: boolean;
}

interface UseH1BCachedReturn {
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

  // Cache management
  clearCache: () => Promise<void>;
  getCacheStats: () => Promise<any>;
  cacheHitRate: number;
}

/**
 * Hook for H1B data with IndexedDB caching for lightning-fast performance
 */
export function useH1BCached(options: UseH1BCachedOptions = {}): UseH1BCachedReturn {
  const {
    initialFilters = {},
    initialPageSize = 20,
    debounceMs = 300,
    enablePrefetch = true
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
  const [cacheHitRate, setCacheHitRate] = useState(0);

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

  // Fetch data with caching
  const fetchData = useCallback(async (
    filtersToUse: Partial<H1BFilters> = filters,
    page: number = currentPage,
    size: number = pageSize
  ) => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      setError(null);

      const options: H1BFilterOptions = {
        pageSize: size,
        pageNumber: page,
        sortBy: 'id',
        sortOrder: 'desc'
      };

      // Fetch data and statistics in parallel
      const [paginatedResult, statisticsResult] = await Promise.all([
        H1BCachedService.getFilteredApplications(filtersToUse, options),
        H1BCachedService.getStatistics(filtersToUse)
      ]);

      setPaginatedData(paginatedResult);
      setStatistics(statisticsResult);

      // Update cache hit rate
      const stats = await H1BCachedService.getCacheStats();
      setCacheHitRate(stats.hitRate);

      const queryTime = performance.now() - startTime;
      console.log(`📊 Query completed in ${Math.round(queryTime)}ms (Cache hit rate: ${Math.round(stats.hitRate)}%)`);

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch H1B data';
      setError(errorMessage);
      console.error('Cached H1B fetch error:', err);
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

    // For page changes, don't debounce
    if (page !== 1) {
      fetchData(filtersToUse, page, size);
      return;
    }

    // Debounce filter changes
    const timeout = setTimeout(() => {
      fetchData(filtersToUse, page, size);
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [fetchData, pageSize, debounceMs, debounceTimeout]);

  // Load unique values with caching
  const loadUniqueValues = useCallback(async () => {
    try {
      const [employers, statuses, jobTitles] = await Promise.all([
        H1BCachedService.getUniqueEmployers(50),
        H1BCachedService.getUniqueStatuses(),
        H1BCachedService.getUniqueJobTitles(30)
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
    setCurrentPage(1);
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

  // Clear cache
  const clearCache = useCallback(async () => {
    await H1BCachedService.clearCache();
    setCacheHitRate(0);
    console.log('🗑️ Cache cleared');
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(async () => {
    return await H1BCachedService.getCacheStats();
  }, []);

  // Export all filtered data
  const exportAllData = useCallback(async (): Promise<H1BRecord[]> => {
    try {
      console.log('Exporting all filtered data with current filters:', filters);
      return await H1BCachedService.exportAllFilteredData(filters);
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
    fetchData();
    loadUniqueValues();

    // Prefetch common filters if enabled
    if (enablePrefetch) {
      setTimeout(() => {
        H1BCachedService.prefetchCommonFilters().catch(console.error);
      }, 1000);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, []); // Only run on mount

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

    // Cache management
    clearCache,
    getCacheStats,
    cacheHitRate
  };
}

/**
 * Hook for cache performance monitoring
 */
export function useH1BCacheMonitor() {
  const [cacheStats, setCacheStats] = useState({
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    oldestEntry: 0,
    newestEntry: 0
  });

  const updateStats = useCallback(async () => {
    try {
      const stats = await H1BCachedService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  }, []);

  useEffect(() => {
    updateStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    cacheStats,
    updateStats,
    clearCache: H1BCachedService.clearCache
  };
}