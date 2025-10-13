import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { H1BFilters, H1BRecord, PaginatedData, H1BStatistics } from '../types/h1b';
import { H1BOptimizedService } from '../services/h1bOptimizedService';

interface UseH1BOptimizedOptions {
  initialFilters?: Partial<H1BFilters>;
  initialPageSize?: number;
  debounceMs?: number;
  enableCache?: boolean;
  enablePreloading?: boolean;
}

interface UseH1BOptimizedReturn {
  // Data
  data: H1BRecord[];
  paginatedData: PaginatedData<H1BRecord> | null;
  statistics: Partial<H1BStatistics> | null;
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

  // Performance metrics
  lastQueryTime: number;
  cacheHitRate: number;
}

/**
 * Optimized H1B hook with performance improvements
 */
export function useH1BOptimized(options: UseH1BOptimizedOptions = {}): UseH1BOptimizedReturn {
  const {
    initialFilters = {},
    initialPageSize = 20,
    debounceMs = 300,
    enableCache = true,
    enablePreloading = true
  } = options;

  // State
  const [paginatedData, setPaginatedData] = useState<PaginatedData<H1BRecord> | null>(null);
  const [statistics, setStatistics] = useState<Partial<H1BStatistics> | null>(null);
  const [uniqueValues, setUniqueValues] = useState({
    employers: [] as string[],
    statuses: [] as string[],
    jobTitles: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [lastQueryTime, setLastQueryTime] = useState(0);
  const [cacheHitRate, setCacheHitRate] = useState(0);

  // Refs for performance tracking
  const queryCount = useRef(0);
  const cacheHits = useRef(0);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Filters state with memoization
  const [filters, setFilters] = useState<H1BFilters>(() => ({
    employer: '',
    status: '',
    jobTitle: '',
    minSalary: null,
    maxSalary: null,
    searchTerm: '',
    ...initialFilters
  }));

  // Memoized filter key for change detection
  const filterKey = useMemo(() => 
    JSON.stringify(filters), [filters]
  );

  // Optimized data fetching
  const fetchData = useCallback(async (
    filtersToUse: Partial<H1BFilters> = filters,
    page: number = currentPage,
    size: number = pageSize,
    skipLoading: boolean = false
  ) => {
    const startTime = performance.now();
    
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);

      queryCount.current++;

      // Fetch data and lightweight stats in parallel
      const [paginatedResult, statsResult] = await Promise.all([
        H1BOptimizedService.getFilteredApplicationsOptimized(filtersToUse, size, page),
        H1BOptimizedService.getLightweightStats(filtersToUse)
      ]);

      setPaginatedData(paginatedResult);
      setStatistics(statsResult);

      // Update performance metrics
      const queryTime = performance.now() - startTime;
      setLastQueryTime(Math.round(queryTime));
      setCacheHitRate(Math.round((cacheHits.current / queryCount.current) * 100));

    } catch (err: any) {
      if (err.message !== 'Request cancelled') {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch H1B data';
        setError(errorMessage);
        console.error('Optimized H1B fetch error:', err);
      }
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, [filters, currentPage, pageSize]);

  // Debounced fetch for filter changes
  const debouncedFetch = useCallback((
    filtersToUse: Partial<H1BFilters>,
    page: number = 1,
    size: number = pageSize
  ) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // For initial load or page changes, don't debounce
    if (isInitialLoad.current || page !== 1) {
      fetchData(filtersToUse, page, size);
      isInitialLoad.current = false;
      return;
    }

    // Debounce filter changes
    debounceTimeout.current = setTimeout(() => {
      fetchData(filtersToUse, page, size);
    }, debounceMs);
  }, [fetchData, pageSize, debounceMs]);

  // Load unique values with caching
  const loadUniqueValues = useCallback(async () => {
    try {
      const [employers, statuses, jobTitles] = await Promise.all([
        H1BOptimizedService.getUniqueValuesOptimized('employer_name', 50),
        H1BOptimizedService.getUniqueValuesOptimized('case_status', 20),
        H1BOptimizedService.getUniqueValuesOptimized('job_title', 30)
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

  // Preload next page for better UX
  const preloadNextPage = useCallback(async () => {
    if (!enablePreloading || !paginatedData?.hasNextPage) return;

    try {
      // Preload in background without showing loading state
      await H1BOptimizedService.getFilteredApplicationsOptimized(
        filters,
        pageSize,
        currentPage + 1
      );
      cacheHits.current++;
    } catch (err) {
      // Ignore preload errors
    }
  }, [enablePreloading, paginatedData, filters, pageSize, currentPage]);

  // Update filters with optimization
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

  // Set page with preloading
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    fetchData(filters, page, pageSize);
    
    // Preload next page after a short delay
    setTimeout(() => preloadNextPage(), 100);
  }, [fetchData, filters, pageSize, preloadNextPage]);

  // Set page size
  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    fetchData(filters, 1, size);
  }, [fetchData, filters]);

  // Refresh data
  const refresh = useCallback(async () => {
    H1BOptimizedService.clearCache();
    await fetchData(filters, currentPage, pageSize);
    await loadUniqueValues();
  }, [fetchData, loadUniqueValues, filters, currentPage, pageSize]);

  // Computed values with memoization
  const data = useMemo(() => paginatedData?.data || [], [paginatedData]);
  const totalPages = useMemo(() => paginatedData?.totalPages || 0, [paginatedData]);
  const totalRecords = useMemo(() => paginatedData?.totalRecords || 0, [paginatedData]);

  // Initial data load
  useEffect(() => {
    fetchData();
    loadUniqueValues();

    // Cleanup on unmount
    return () => {
      H1BOptimizedService.cancelRequests();
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []); // Only run on mount

  // Preload next page when current page data loads
  useEffect(() => {
    if (paginatedData && !loading) {
      setTimeout(() => preloadNextPage(), 500);
    }
  }, [paginatedData, loading, preloadNextPage]);

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

    // Performance metrics
    lastQueryTime,
    cacheHitRate
  };
}

/**
 * Performance monitoring hook
 */
export function useH1BPerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    averageQueryTime: 0,
    totalQueries: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  const updateMetrics = useCallback((queryTime: number, wasError: boolean, wasCacheHit: boolean) => {
    setMetrics(prev => {
      const newTotalQueries = prev.totalQueries + 1;
      const newAverageQueryTime = (prev.averageQueryTime * prev.totalQueries + queryTime) / newTotalQueries;
      
      return {
        averageQueryTime: Math.round(newAverageQueryTime),
        totalQueries: newTotalQueries,
        cacheHitRate: wasCacheHit ? Math.round(((prev.cacheHitRate * prev.totalQueries) + 100) / newTotalQueries) : prev.cacheHitRate,
        errorRate: wasError ? Math.round(((prev.errorRate * prev.totalQueries) + 100) / newTotalQueries) : prev.errorRate
      };
    });
  }, []);

  return { metrics, updateMetrics };
}