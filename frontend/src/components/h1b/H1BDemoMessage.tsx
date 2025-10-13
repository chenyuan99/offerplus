import React from 'react';

interface H1BDemoMessageProps {
  onRetry?: () => void;
}

export function H1BDemoMessage({ onRetry }: H1BDemoMessageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            H1B Data Explorer
          </h3>

          {/* Description */}
          <div className="text-gray-600 mb-6 space-y-3">
            <p>
              The H1B database is currently not available or is being set up.
            </p>
            <p className="text-sm">
              This feature provides advanced filtering and analysis of H1B visa application data 
              including employer statistics, salary ranges, and approval rates.
            </p>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-blue-900 mb-2">To set up H1B data:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Create the <code className="bg-blue-100 px-1 rounded">h1b_applications</code> table in Supabase</li>
              <li>Import H1B data from USCIS or other sources</li>
              <li>Run the database migrations for optimal performance</li>
              <li>Configure proper indexes for fast filtering</li>
            </ol>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">🔍 Advanced Filtering</h5>
              <p className="text-sm text-gray-600">
                Filter by employer, job title, salary range, case status, and more
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">📊 Real-time Statistics</h5>
              <p className="text-sm text-gray-600">
                View approval rates, salary trends, and top sponsoring employers
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">🔗 Shareable URLs</h5>
              <p className="text-sm text-gray-600">
                Share filtered views with URL parameters for collaboration
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">⚡ High Performance</h5>
              <p className="text-sm text-gray-600">
                Optimized queries with server-side filtering and pagination
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Retry Connection
              </button>
            )}
            <button
              type="button"
              onClick={() => window.open('https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub', '_blank')}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              View USCIS Data Hub
            </button>
          </div>

          {/* Technical Note */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              This component uses Supabase for data storage and native PostgreSQL filtering for optimal performance.
              <br />
              Check the browser console for detailed error information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}