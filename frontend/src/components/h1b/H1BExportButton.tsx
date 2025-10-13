import React, { useState } from 'react';
import { H1BRecord, H1BFilters } from '../../types/h1b';
import { exportH1BToCSV, getExportSummary } from '../../utils/csvExport';

interface H1BExportButtonProps {
  data: H1BRecord[];
  filters?: Partial<H1BFilters>;
  totalRecords?: number;
  loading?: boolean;
  onExportAll?: () => Promise<H1BRecord[]>;
  className?: string;
}

export function H1BExportButton({
  data,
  filters,
  totalRecords,
  loading = false,
  onExportAll,
  className = ''
}: H1BExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleExportCurrent = async () => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExporting(true);
    try {
      const filename = `h1b_filtered_data_${new Date().toISOString().split('T')[0]}.csv`;
      exportH1BToCSV(data, filename);
      
      const summary = getExportSummary(data.length, filters);
      console.log('Export completed:', summary);
      
      // Show success message
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = `✓ Exported ${data.length} records`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  const handleExportAll = async () => {
    if (!onExportAll) {
      alert('Export all functionality not available');
      return;
    }

    setIsExporting(true);
    try {
      const allData = await onExportAll();
      const filename = `h1b_all_filtered_data_${new Date().toISOString().split('T')[0]}.csv`;
      exportH1BToCSV(allData, filename);
      
      const summary = getExportSummary(allData.length, filters);
      console.log('Export all completed:', summary);
      
      // Show success message
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = `✓ Exported ${allData.length} records`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Export all failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  const hasMultiplePages = totalRecords && totalRecords > data.length;

  return (
    <div className="relative">
      {/* Single Export Button (when no pagination or export all not available) */}
      {!hasMultiplePages || !onExportAll ? (
        <button
          type="button"
          onClick={handleExportCurrent}
          disabled={loading || isExporting || data.length === 0}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV ({data.length})
            </>
          )}
        </button>
      ) : (
        /* Dropdown Export Button (when pagination exists) */
        <>
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            disabled={loading || isExporting || data.length === 0}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>

          {/* Dropdown Menu */}
          {showOptions && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu">
                <button
                  type="button"
                  onClick={handleExportCurrent}
                  disabled={isExporting}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="font-medium">Current Page</div>
                    <div className="text-xs text-gray-500">{data.length} records</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={handleExportAll}
                  disabled={isExporting}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  role="menuitem"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  <div>
                    <div className="font-medium">All Filtered Results</div>
                    <div className="text-xs text-gray-500">
                      {totalRecords?.toLocaleString()} records
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Click outside to close dropdown */}
      {showOptions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}