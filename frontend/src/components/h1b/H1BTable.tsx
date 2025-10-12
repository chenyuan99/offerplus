import React, { useState } from 'react';
import { H1BRecord, SortConfig, PaginatedData } from '../../types/h1b';

interface H1BTableProps {
  data: PaginatedData<H1BRecord>;
  sortConfig: SortConfig;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
}

export function H1BTable({
  data,
  sortConfig,
  onSort,
  onPageChange,
  onPageSizeChange,
  loading = false
}: H1BTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<H1BRecord | null>(null);

  const handleSort = (column: string) => {
    const direction = sortConfig.column === column && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    onSort(column, direction);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'certified':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (column: string) => {
    if (sortConfig.column !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading H1B application data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters to see more results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('case_number')}
              >
                <div className="flex items-center space-x-1">
                  <span>Case Number</span>
                  {getSortIcon('case_number')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('employer_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Employer</span>
                  {getSortIcon('employer_name')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('job_title')}
              >
                <div className="flex items-center space-x-1">
                  <span>Job Title</span>
                  {getSortIcon('job_title')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('case_status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('case_status')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('wage_rate_of_pay_from')}
              >
                <div className="flex items-center space-x-1">
                  <span>Salary</span>
                  {getSortIcon('wage_rate_of_pay_from')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('decision_date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Decision Date</span>
                  {getSortIcon('decision_date')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.data.map((record) => (
              <tr
                key={record.case_number}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedRecord(record)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.case_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={record.employer_name}>
                    {record.employer_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={record.job_title}>
                    {record.job_title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(record.case_status)}`}>
                    {record.case_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(record.wage_rate_of_pay_from)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.worksite_city && record.worksite_state
                    ? `${record.worksite_city}, ${record.worksite_state}`
                    : record.worksite_city || record.worksite_state || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(record.decision_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={data.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">
              of {data.totalRecords.toLocaleString()} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(data.currentPage - 1)}
              disabled={!data.hasPreviousPage}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {data.currentPage} of {data.totalPages}
            </span>

            <button
              onClick={() => onPageChange(data.currentPage + 1)}
              disabled={!data.hasNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal for detailed view */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Application Details</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Case Number:</strong> {selectedRecord.case_number}
              </div>
              <div>
                <strong>Status:</strong> 
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedRecord.case_status)}`}>
                  {selectedRecord.case_status}
                </span>
              </div>
              <div>
                <strong>Employer:</strong> {selectedRecord.employer_name}
              </div>
              <div>
                <strong>Job Title:</strong> {selectedRecord.job_title}
              </div>
              <div>
                <strong>Salary:</strong> {formatCurrency(selectedRecord.wage_rate_of_pay_from)}
              </div>
              <div>
                <strong>Wage Unit:</strong> {selectedRecord.wage_unit_of_pay || 'N/A'}
              </div>
              <div>
                <strong>Work Location:</strong> {
                  selectedRecord.worksite_city && selectedRecord.worksite_state
                    ? `${selectedRecord.worksite_city}, ${selectedRecord.worksite_state}`
                    : 'N/A'
                }
              </div>
              <div>
                <strong>Decision Date:</strong> {formatDate(selectedRecord.decision_date)}
              </div>
              <div>
                <strong>Begin Date:</strong> {formatDate(selectedRecord.begin_date)}
              </div>
              <div>
                <strong>End Date:</strong> {formatDate(selectedRecord.end_date)}
              </div>
              <div>
                <strong>Full Time:</strong> {selectedRecord.full_time_position || 'N/A'}
              </div>
              <div>
                <strong>SOC Code:</strong> {selectedRecord.soc_code || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}