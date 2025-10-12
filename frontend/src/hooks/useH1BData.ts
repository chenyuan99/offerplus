import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { H1BRecord, H1BFilters, H1BStatistics, PaginatedData, SortConfig } from '../types/h1b';

const TABLE_NAME = 'h1b_applications';

export function useH1BData() {
  const [data, setData] = useState<H1BRecord[]>([]);
  const [filteredData, setFilteredData] = useState<H1BRecord[]>([]);
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

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total count first
      const { count: totalCount, error: countError } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Failed to get record count: ${countError.message}`);
      }

      console.log(`📊 Total records in database: ${totalCount}`);

      // Fetch data with reasonable limit
      const limit = Math.min(totalCount || 5000, 5000);
      
      const { data: records, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw new Error(`Failed to fetch data: ${fetchError.message}`);
      }

      if (!records || records.length === 0) {
        throw new Error('No H1B records found in the database');
      }

      console.log(`✅ Successfully loaded ${records.length} H1B records`);
      setData(records);
      setFilteredData(records);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load H1B data';
      console.error('❌ Error fetching H1B data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters to data
  const applyFilters = useCallback((newFilters: Partial<H1BFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    let filtered = [...data];

    // Apply employer filter
    if (updatedFilters.employer) {
      filtered = filtered.filter(record =>
        record.employer_name?.toLowerCase().includes(updatedFilters.employer.toLowerCase())
      );
    }

    // Apply status filter
    if (updatedFilters.status) {
      filtered = filtered.filter(record =>
        record.case_status === updatedFilters.status
      );
    }

    // Apply job title filter
    if (updatedFilters.jobTitle) {
      filtered = filtered.filter(record =>
        record.job_title?.toLowerCase().includes(updatedFilters.jobTitle.toLowerCase())
      );
    }

    // Apply salary range filters
    if (updatedFilters.minSalary !== null && updatedFilters.minSalary !== undefined) {
      filtered = filtered.filter(record =>
        record.wage_rate_of_pay_from && record.wage_rate_of_pay_from >= updatedFilters.minSalary!
      );
    }

    if (updatedFilters.maxSalary !== null && updatedFilters.maxSalary !== undefined) {
      filtered = filtered.filter(record =>
        record.wage_rate_of_pay_from && record.wage_rate_of_pay_from <= updatedFilters.maxSalary!
      );
    }

    // Apply search filter
    if (updatedFilters.searchTerm) {
      const searchTerm = updatedFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const searchableText = [
          record.case_number,
          record.employer_name,
          record.job_title,
          record.soc_title,
          record.worksite_city,
          record.worksite_state,
          record.employer_city,
          record.employer_state
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }

    setFilteredData(filtered);
  }, [data, filters]);

  // Apply sorting
  const applySorting = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });

    const sorted = [...filteredData].sort((a, b) => {
      let aValue: string | number | Date | null = a[column as keyof H1BRecord] as string | number | Date | null;
      let bValue: string | number | Date | null = b[column as keyof H1BRecord] as string | number | Date | null;

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different data types
      if (column === 'wage_rate_of_pay_from' || column === 'prevailing_wage') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (column.includes('_date')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return direction === 'desc' ? -comparison : comparison;
    });

    setFilteredData(sorted);
  }, [filteredData]);

  // Get paginated data
  const getPaginatedData = useCallback((page: number = 1, pageSize: number = 50): PaginatedData<H1BRecord> => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedRecords,
      totalRecords: filteredData.length,
      totalPages: Math.ceil(filteredData.length / pageSize),
      currentPage: page,
      pageSize,
      hasNextPage: endIndex < filteredData.length,
      hasPreviousPage: page > 1
    };
  }, [filteredData]);

  // Calculate statistics
  const statistics = useMemo((): H1BStatistics => {
    if (filteredData.length === 0) {
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

    // Calculate salary statistics
    const salaries = filteredData
      .map(record => record.wage_rate_of_pay_from)
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
    filteredData.forEach(record => {
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
    filteredData.forEach(record => {
      const status = record.case_status || 'Unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Calculate certification rate
    const certifiedCount = statusBreakdown['Certified'] || 0;
    const certificationRate = filteredData.length > 0
      ? Math.round((certifiedCount / filteredData.length) * 100)
      : 0;

    return {
      totalApplications: filteredData.length,
      averageSalary,
      medianSalary,
      minSalary: salaries.length > 0 ? salaries[0] : 0,
      maxSalary: salaries.length > 0 ? salaries[salaries.length - 1] : 0,
      topEmployers,
      statusBreakdown,
      certificationRate
    };
  }, [filteredData]);

  // Get unique values for filters
  const getUniqueValues = useCallback((field: keyof H1BRecord, limit?: number): string[] => {
    const values = new Set<string>();
    data.forEach(record => {
      const value = record[field];
      if (value && typeof value === 'string' && value.trim() !== '') {
        values.add(value.trim());
      }
    });
    
    const sortedValues = Array.from(values).sort();
    return limit ? sortedValues.slice(0, limit) : sortedValues;
  }, [data]);

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
    setFilteredData(data);
  }, [data]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: filteredData,
    loading,
    error,
    filters,
    sortConfig,
    statistics,
    applyFilters,
    applySorting,
    getPaginatedData,
    getUniqueValues,
    clearFilters,
    refetch: fetchData
  };
}