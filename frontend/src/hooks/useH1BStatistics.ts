import { useState, useEffect, useCallback } from 'react';
import { H1BStatistics, H1BFilters } from '../types/h1b';
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
    clearCache
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

// Hook for top employers
export function useTopH1BEmployers(limit: number = 10, searchTerm?: string) {
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEmployers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await H1BStatisticsService.getTopEmployers(limit, 0, searchTerm);
      setEmployers(result.data);
      setTotalCount(result.totalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch top employers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit, searchTerm]);

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