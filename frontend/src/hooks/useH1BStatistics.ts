import { useState, useEffect, useCallback } from 'react';
import { H1BStatistics, H1BFilters, H1BRecord, PaginatedData } from '../types/h1b';
import { H1BStatisticsService } from '../services/h1bStatisticsService';

interface UseH1BStatisticsOptions {
  filters?: Partial<H1BFilters>;
  enableCache?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseH1BStatisticsReturn {
  statistics: H1BStatistics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
  // New filter functions
  getUniqueEmployers: (limit?: number) => Promise<string[]>;
  getUniqueStatuses: () => Promise<string[]>;
  getUniqueJobTitles: (limit?: number) => Promise<string[]>;
  getUniqueValues: (field: string, limit?: number) => Promise<string[]>;
}

export function useH1BStatistics(options: UseH1BStatisticsOptions = {}): UseH1BStatisticsReturn {
  const {
    filters,
    enableCache = true,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options;

  const [statistics, setStatistics] = useState<H1BStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate filters first
      if (filters) {
        const validation = H1BStatisticsService.validateFilters(filters);
        if (!validation.valid) {
          throw new Error(`Invalid filters: ${validation.errors.join(', ')}`);
        }
      }

      const data = enableCache 
        ? await H1BStatisticsService.getCachedStatistics(filters)
        : await H1BStatisticsService.getStatistics(filters);

      setStatistics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch H1B statistics';
      setError(errorMessage);
      console.error('Error fetching H1B statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, enableCache]);

  const refresh = useCallback(async () => {
    await fetchStatistics();
  }, [fetchStatistics]);

  const clearCache = useCallback(() => {
    H1BStatisticsService.clearCache();
  }, []);

  // Filter function implementations
  const getUniqueEmployers = useCallback(async (limit?: number) => {
    return H1BStatisticsService.getUniqueEmployers(limit);
  }, []);

  const getUniqueStatuses = useCallback(async () => {
    return H1BStatisticsService.getUniqueStatuses();
  }, []);

  const getUniqueJobTitles = useCallback(async (limit?: number) => {
    return H1BStatisticsService.getUniqueJobTitles(limit);
  }, []);

  const getUniqueValues = useCallback(async (field: string, limit?: number) => {
    return H1BStatisticsService.getUniqueValues(field, limit);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatistics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh,
    clearCache,
    getUniqueEmployers,
    getUniqueStatuses,
    getUniqueJobTitles,
    getUniqueValues
  };
}

// Hook for quick dashboard statistics
export function useQuickH1BStats() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    averageSalary: 0,
    certificationRate: 0,
    topEmployer: 'N/A'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const quickStats = await H1BStatisticsService.getQuickStats();
        setStats(quickStats);
      } catch (error) {
        console.error('Error fetching quick stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickStats();
  }, []);

  return { stats, loading };
}

// Hook for filtered H1B applications with pagination
export function useH1BFilteredApplications(
  filters: Partial<H1BFilters> = {},
  pageSize: number = 20,
  pageNumber: number = 1
) {
  const [data, setData] = useState<PaginatedData<H1BRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await H1BStatisticsService.getFilteredApplications(filters, pageSize, pageNumber);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch filtered applications';
      setError(errorMessage);
      console.error('Error fetching filtered applications:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, pageNumber]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

// Hook for unique values with caching
export function useH1BUniqueValues(field: string, limit?: number) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchValues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await H1BStatisticsService.getUniqueValues(field, limit);
      setValues(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch unique ${field} values`;
      setError(errorMessage);
      console.error(`Error fetching unique ${field} values:`, err);
    } finally {
      setLoading(false);
    }
  }, [field, limit]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  return {
    values,
    loading,
    error,
    refresh: fetchValues
  };
}

// Hook for top employers
export function useTopH1BEmployers(limit: number = 10) {
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEmployers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await H1BStatisticsService.getTopEmployers(limit);
      setEmployers(result.data);
      setTotalCount(result.totalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch top employers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  return {
    employers,
    loading,
    error,
    totalCount,
    refresh: fetchEmployers
  };
}

// Hook for H1B trends
export function useH1BTrends(
  startDate?: Date,
  endDate?: Date,
  groupBy: 'month' | 'quarter' | 'year' = 'month'
) {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await H1BStatisticsService.getTrends(startDate, endDate, groupBy);
      setTrends(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch H1B trends';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupBy]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return {
    trends,
    loading,
    error,
    refresh: fetchTrends
  };
}

// Hook for state statistics
export function useH1BStateStatistics() {
  const [stateStats, setStateStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStateStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await H1BStatisticsService.getStatisticsByState();
        setStateStats(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch state statistics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStateStats();
  }, []);

  return {
    stateStats,
    loading,
    error
  };
}