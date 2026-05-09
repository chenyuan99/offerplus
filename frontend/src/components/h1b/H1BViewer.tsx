import { useState, useCallback } from 'react';
import { useH1BData } from '../../hooks/useH1BData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { H1BFiltersComponent } from './H1BFilters';
import { H1BStatisticsComponent } from './H1BStatistics';
import { H1BTable } from './H1BTable';
import { H1BUrlExamples } from './H1BUrlExamples';
import { H1BFilters } from '../../types/h1b';

export function H1BViewer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // URL-synchronized filters
  const {
    filters: urlFilters,
    updateFilters: updateUrlFilters,
    clearFilters: clearUrlFilters,
    getShareableUrl
  } = useUrlFilters();

  const {
    loading,
    error,
    sortConfig,
    statistics,
    applyFilters,
    applySorting,
    getPaginatedData,
    getUniqueValues,
    refetch
  } = useH1BData({ initialFilters: urlFilters });

  // Get paginated data
  const paginatedData = getPaginatedData(currentPage, pageSize);

  // Handle filter changes (sync with URL and data hook)
  const handleFiltersChange = useCallback((newFilters: Partial<H1BFilters>) => {
    updateUrlFilters(newFilters);
    applyFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [updateUrlFilters, applyFilters]);

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

  // Handle clear filters (sync with URL and data hook)
  const handleClearFilters = useCallback(() => {
    clearUrlFilters();
    setCurrentPage(1);
  }, [clearUrlFilters]);

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

        {/* URL Examples */}
        <H1BUrlExamples />

        {/* Filters */}
        <H1BFiltersComponent
          filters={urlFilters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          getUniqueValues={(field: string, limit?: number) => getUniqueValues(field as keyof import('../../types/h1b').H1BRecord, limit)}
          loading={loading}
        />

        {/* Share URL Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Share this filtered view</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const url = getShareableUrl();
                navigator.clipboard.writeText(url).then(() => {
                  // You could add a toast notification here
                  console.log('URL copied to clipboard:', url);
                }).catch(err => {
                  console.error('Failed to copy URL:', err);
                });
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>

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