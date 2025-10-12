import { useState, useCallback } from 'react';
import { useH1BData } from '../../hooks/useH1BData';
import { H1BFiltersComponent } from './H1BFilters';
import { H1BStatisticsComponent } from './H1BStatistics';
import { H1BTable } from './H1BTable';
import { H1BFilters } from '../../types/h1b';

export function H1BViewer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
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
    refetch
  } = useH1BData();

  // Get paginated data
  const paginatedData = getPaginatedData(currentPage, pageSize);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<H1BFilters>) => {
    applyFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [applyFilters]);

  // Handle sorting
  const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    applySorting(column, direction);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [applySorting]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle page size changes
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
    setCurrentPage(1);
  }, [clearFilters]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Error Loading H1B Data</h3>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">H1B Data Viewer</h1>
              <p className="mt-2 text-gray-600">
                Interactive explorer for H1B visa application data with advanced filtering and analysis
              </p>
            </div>
            
            {/* Data Source Indicator */}
            <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Supabase Database</span>
              {!loading && (
                <span className="text-sm text-gray-500">
                  ({statistics.totalApplications.toLocaleString()} records)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <H1BStatisticsComponent statistics={statistics} loading={loading} />

        {/* Filters */}
        <H1BFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          getUniqueValues={(field: string, limit?: number) => getUniqueValues(field as keyof import('../../types/h1b').H1BRecord, limit)}
          loading={loading}
        />

        {/* Table */}
        <H1BTable
          data={paginatedData}
          sortConfig={sortConfig}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      </div>
    </div>
  );
}