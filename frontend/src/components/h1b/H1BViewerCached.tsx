import { useCallback } from 'react';
import { useH1BCached } from '../../hooks/useH1BCached';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { H1BFiltersComponent } from './H1BFilters';
import { H1BStatisticsComponent } from './H1BStatistics';
import { H1BTable } from './H1BTable';
import { H1BUrlExamples } from './H1BUrlExamples';
import { H1BDemoMessage } from './H1BDemoMessage';
import { H1BCacheMonitor } from './H1BCacheMonitor';
import { H1BExportButton } from './H1BExportButton';
import { 
  H1BTableLoadingSkeleton, 
  H1BStatsLoadingSkeleton, 
  H1BFiltersLoadingSkeleton,
  H1BSmartLoadingIndicator 
} from './H1BLoadingOverlay';
import { H1BFilters } from '../../types/h1b';

export function H1BViewerCached() {
  // URL-synchronized filters
  const {
    filters: urlFilters,
    updateFilters: updateUrlFilters,
    clearFilters: clearUrlFilters,
    getShareableUrl
  } = useUrlFilters();

  // Cached H1B data with IndexedDB
  const {
    data,
    paginatedData,
    statistics,
    uniqueValues,
    loading,
    error,
    totalRecords,
    updateFilters: updateDataFilters,
    clearFilters: clearDataFilters,
    setPage,
    setPageSize,
    refresh,
    clearCache,
    cacheHitRate,
    exportAllData
  } = useH1BCached({
    initialFilters: urlFilters,
    initialPageSize: 20,
    debounceMs: 300,
    enablePrefetch: true
  });

  // Handle filter changes (sync with URL and data)
  const handleFiltersChange = useCallback((newFilters: Partial<H1BFilters>) => {
    updateUrlFilters(newFilters);
    updateDataFilters(newFilters);
  }, [updateUrlFilters, updateDataFilters]);

  // Handle clear filters (sync with URL and data)
  const handleClearFilters = useCallback(() => {
    clearUrlFilters();
    clearDataFilters();
  }, [clearUrlFilters, clearDataFilters]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setPage(page);
  }, [setPage]);

  // Handle page size changes
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
  }, [setPageSize]);

  // Handle sorting (placeholder for now)
  const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    console.log('Sorting:', column, direction);
    // TODO: Implement sorting in cached service
  }, []);

  // Get unique values for dropdowns (sync version for backward compatibility)
  const getUniqueValuesSync = useCallback((field: string, limit?: number): string[] => {
    switch (field) {
      case 'employer_name':
      case 'employer':
        return uniqueValues.employers.slice(0, limit || 50);
      case 'case_status':
      case 'status':
        return uniqueValues.statuses;
      case 'job_title':
      case 'jobTitle':
        return uniqueValues.jobTitles.slice(0, limit || 30);
      default:
        return [];
    }
  }, [uniqueValues]);

  // Show demo message if there's a database connection issue
  if (error && (
    error.includes('timeout') || 
    error.includes('canceling statement') ||
    error.includes('relation') ||
    error.includes('does not exist') ||
    totalRecords === 0
  )) {
    return <H1BDemoMessage onRetry={refresh} />;
  }

  // Show error for other types of errors
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
              type="button"
              onClick={refresh}
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
      {/* Smart Loading Indicator */}
      <H1BSmartLoadingIndicator 
        isLoading={loading} 
        cacheHitRate={cacheHitRate}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">H1B Data Explorer</h1>
              <p className="mt-2 text-gray-600">
                Lightning-fast H1B visa data analysis with IndexedDB caching
              </p>
            </div>
            
            {/* Data Source Indicator */}
            <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Cached Filtering</span>
              {!loading && statistics && (
                <span className="text-sm text-gray-500">
                  ({statistics.totalApplications.toLocaleString()} records)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cache Performance Monitor */}
        <H1BCacheMonitor 
          cacheHitRate={cacheHitRate} 
          onClearCache={clearCache}
        />

        {/* Statistics */}
        {loading && !statistics ? (
          <H1BStatsLoadingSkeleton />
        ) : (
          <H1BStatisticsComponent filters={urlFilters} />
        )}

        {/* URL Examples */}
        <H1BUrlExamples />

        {/* Filters */}
        {loading && uniqueValues.employers.length === 0 ? (
          <H1BFiltersLoadingSkeleton />
        ) : (
          <H1BFiltersComponent
            filters={urlFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            getUniqueValues={getUniqueValuesSync}
            loading={loading}
          />
        )}

        {/* Share URL and Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Share & Export</span>
              {totalRecords > 0 && (
                <span className="text-sm text-gray-500">
                  ({totalRecords.toLocaleString()} results)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <H1BExportButton
                data={data}
                filters={urlFilters}
                totalRecords={totalRecords}
                loading={loading}
                onExportAll={exportAllData}
              />
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = getShareableUrl();
                  navigator.clipboard.writeText(url).then(() => {
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
        </div>

        {/* Performance Info */}
        {!loading && paginatedData && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  IndexedDB Caching Active
                </span>
                <span className="text-sm text-blue-700">
                  • Instant results • Offline capable • Compressed storage
                </span>
              </div>
              <div className="text-sm text-blue-600">
                Cache Hit Rate: {Math.round(cacheHitRate)}%
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading && !paginatedData ? (
          <H1BTableLoadingSkeleton />
        ) : (
          <H1BTable
            data={paginatedData || {
              data: [],
              totalRecords: 0,
              totalPages: 0,
              currentPage: 1,
              pageSize: 20,
              hasNextPage: false,
              hasPreviousPage: false
            }}
            sortConfig={{ column: null, direction: 'asc' }}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}