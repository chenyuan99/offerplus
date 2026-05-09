import React, { useState, useEffect } from 'react';
import { H1BFilters } from '../../types/h1b';

interface H1BFiltersProps {
  filters: H1BFilters;
  onFiltersChange: (filters: Partial<H1BFilters>) => void;
  onClearFilters: () => void;
  getUniqueValues: (field: string, limit?: number) => string[];
  loading?: boolean;
}

export function H1BFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  getUniqueValues,
  loading = false
}: H1BFiltersProps) {
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get unique values for dropdowns
  const employers = getUniqueValues('employer_name', 50);
  const statuses = getUniqueValues('case_status');
  const jobTitles = getUniqueValues('job_title', 30);

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onFiltersChange({ searchTerm: value });
    }, 300);

    setSearchTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="col-span-full">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Applications
            {loading && (
              <span className="ml-2 inline-flex items-center">
                <svg className="animate-spin h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </span>
            )}
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by employer, job title, or case number..."
            defaultValue={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={loading}
            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed smooth-transition ${
              loading ? 'loading-pulse' : ''
            }`}
          />
        </div>

        {/* Employer Filter */}
        <div>
          <label htmlFor="employer" className="block text-sm font-medium text-gray-700 mb-2">
            Employer
            {loading && employers.length === 0 && (
              <span className="ml-2 text-xs text-blue-600">Loading...</span>
            )}
          </label>
          <select
            id="employer"
            value={filters.employer}
            onChange={(e) => onFiltersChange({ employer: e.target.value })}
            disabled={loading}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed smooth-transition ${
              loading && employers.length === 0 ? 'skeleton' : ''
            }`}
          >
            <option value="">
              {loading && employers.length === 0 ? 'Loading employers...' : 'All Employers'}
            </option>
            {employers.map((employer) => (
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
            {loading && statuses.length === 0 && (
              <span className="ml-2 text-xs text-blue-600">Loading...</span>
            )}
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value })}
            disabled={loading}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed smooth-transition ${
              loading && statuses.length === 0 ? 'skeleton' : ''
            }`}
          >
            <option value="">
              {loading && statuses.length === 0 ? 'Loading statuses...' : 'All Statuses'}
            </option>
            {statuses.map((status) => (
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
          </label>
          <select
            id="jobTitle"
            value={filters.jobTitle}
            onChange={(e) => onFiltersChange({ jobTitle: e.target.value })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Job Titles</option>
            {jobTitles.map((title) => (
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
            value={filters.minSalary || ''}
            onChange={(e) => onFiltersChange({ 
              minSalary: e.target.value ? Number(e.target.value) : null 
            })}
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
            value={filters.maxSalary || ''}
            onChange={(e) => onFiltersChange({ 
              maxSalary: e.target.value ? Number(e.target.value) : null 
            })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}