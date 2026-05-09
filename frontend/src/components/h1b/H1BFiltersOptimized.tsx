import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { H1BFilters } from '../../types/h1b';

interface H1BFiltersOptimizedProps {
  filters: H1BFilters;
  onFiltersChange: (filters: Partial<H1BFilters>) => void;
  onClearFilters: () => void;
  uniqueValues: {
    employers: string[];
    statuses: string[];
    jobTitles: string[];
  };
  loading?: boolean;
  performanceMetrics?: {
    lastQueryTime: number;
    cacheHitRate: number;
  };
}

/**
 * Optimized H1B Filters component with performance improvements
 */
export const H1BFiltersOptimized = React.memo(function H1BFiltersOptimized({
  filters,
  onFiltersChange,
  onClearFilters,
  uniqueValues,
  loading = false,
  performanceMetrics
}: H1BFiltersOptimizedProps) {
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);

  // Memoized dropdown options
  const employerOptions = useMemo(() => 
    uniqueValues.employers.slice(0, 50), [uniqueValues.employers]
  );

  const statusOptions = useMemo(() => 
    uniqueValues.statuses, [uniqueValues.statuses]
  );

  const jobTitleOptions = useMemo(() => 
    uniqueValues.jobTitles.slice(0, 30), [uniqueValues.jobTitles]
  );

  // Optimized search handler with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onFiltersChange({ searchTerm: value });
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout, onFiltersChange]);

  // Optimized filter handlers
  const handleEmployerChange = useCallback((value: string) => {
    onFiltersChange({ employer: value });
  }, [onFiltersChange]);

  const handleStatusChange = useCallback((value: string) => {
    onFiltersChange({ status: value });
  }, [onFiltersChange]);

  const handleJobTitleChange = useCallback((value: string) => {
    onFiltersChange({ jobTitle: value });
  }, [onFiltersChange]);

  const handleMinSalaryChange = useCallback((value: string) => {
    onFiltersChange({ 
      minSalary: value ? Number(value) : null 
    });
  }, [onFiltersChange]);

  const handleMaxSalaryChange = useCallback((value: string) => {
    onFiltersChange({ 
      maxSalary: value ? Number(value) : null 
    });
  }, [onFiltersChange]);

  // Sync local search term with props
  useEffect(() => {
    setLocalSearchTerm(filters.searchTerm);
  }, [filters.searchTerm]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.employer || 
           filters.status || 
           filters.jobTitle || 
           filters.minSalary !== null || 
           filters.maxSalary !== null || 
           filters.searchTerm;
  }, [filters]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Query Time: <span className="font-medium text-gray-900">{performanceMetrics.lastQueryTime}ms</span>
              </span>
              <span className="text-gray-600">
                Cache Hit Rate: <span className="font-medium text-gray-900">{performanceMetrics.cacheHitRate}%</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                performanceMetrics.lastQueryTime < 500 ? 'bg-green-500' : 
                performanceMetrics.lastQueryTime < 1000 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-500">
                {performanceMetrics.lastQueryTime < 500 ? 'Fast' : 
                 performanceMetrics.lastQueryTime < 1000 ? 'Moderate' : 'Slow'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="col-span-full">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Applications
            {localSearchTerm !== filters.searchTerm && (
              <span className="ml-2 text-xs text-blue-600">(typing...)</span>
            )}
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by employer, job title, or case number..."
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Employer Filter */}
        <div>
          <label htmlFor="employer" className="block text-sm font-medium text-gray-700 mb-2">
            Employer
            <span className="ml-1 text-xs text-gray-500">({employerOptions.length})</span>
          </label>
          <select
            id="employer"
            value={filters.employer}
            onChange={(e) => handleEmployerChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Employers</option>
            {employerOptions.map((employer) => (
              <option key={employer} value={employer}>
                {employer}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Case Status
            <span className="ml-1 text-xs text-gray-500">({statusOptions.length})</span>
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Job Title Filter */}
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
            <span className="ml-1 text-xs text-gray-500">({jobTitleOptions.length})</span>
          </label>
          <select
            id="jobTitle"
            value={filters.jobTitle}
            onChange={(e) => handleJobTitleChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Job Titles</option>
            {jobTitleOptions.map((title) => (
              <option key={title} value={title}>
                {title.length > 50 ? `${title.substring(0, 50)}...` : title}
              </option>
            ))}
          </select>
        </div>

        {/* Min Salary */}
        <div>
          <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700 mb-2">
            Min Salary
          </label>
          <input
            type="number"
            id="minSalary"
            placeholder="0"
            min="0"
            step="1000"
            value={filters.minSalary || ''}
            onChange={(e) => handleMinSalaryChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Max Salary */}
        <div>
          <label htmlFor="maxSalary" className="block text-sm font-medium text-gray-700 mb-2">
            Max Salary
          </label>
          <input
            type="number"
            id="maxSalary"
            placeholder="No limit"
            min="0"
            step="1000"
            value={filters.maxSalary || ''}
            onChange={(e) => handleMaxSalaryChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={loading || !hasActiveFilters}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Clear Filters
            {hasActiveFilters && (
              <span className="ml-1 text-xs">({Object.values(filters).filter(v => v).length})</span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">Active Filters:</span>
              <div className="flex flex-wrap gap-1">
                {filters.employer && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Employer: {filters.employer}
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Status: {filters.status}
                  </span>
                )}
                {filters.jobTitle && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Job: {filters.jobTitle}
                  </span>
                )}
                {filters.minSalary && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Min: ${filters.minSalary.toLocaleString()}
                  </span>
                )}
                {filters.maxSalary && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Max: ${filters.maxSalary.toLocaleString()}
                  </span>
                )}
                {filters.searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Search: "{filters.searchTerm}"
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default H1BFiltersOptimized;