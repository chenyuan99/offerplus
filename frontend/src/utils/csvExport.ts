import { H1BRecord } from '../types/h1b';

/**
 * Converts H1B records to CSV format and triggers download
 */
export function exportH1BToCSV(data: H1BRecord[], filename?: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Case Number',
    'Case Status',
    'Employer Name',
    'Job Title',
    'SOC Code',
    'SOC Title',
    'Full Time Position',
    'Salary From',
    'Salary To',
    'Wage Unit',
    'Prevailing Wage',
    'Worksite City',
    'Worksite State',
    'Worksite Postal Code',
    'Employer City',
    'Employer State',
    'Employer Postal Code',
    'Received Date',
    'Decision Date',
    'Begin Date',
    'End Date',
    'Visa Class'
  ];

  // Convert data to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(record => [
      escapeCsvValue(record.case_number),
      escapeCsvValue(record.case_status),
      escapeCsvValue(record.employer_name),
      escapeCsvValue(record.job_title),
      escapeCsvValue(record.soc_code),
      escapeCsvValue(record.soc_title),
      escapeCsvValue(record.full_time_position),
      record.wage_rate_of_pay_from || '',
      record.wage_rate_of_pay_to || '',
      escapeCsvValue(record.wage_unit_of_pay),
      record.prevailing_wage || '',
      escapeCsvValue(record.worksite_city),
      escapeCsvValue(record.worksite_state),
      escapeCsvValue(record.worksite_postal_code),
      escapeCsvValue(record.employer_city),
      escapeCsvValue(record.employer_state),
      escapeCsvValue(record.employer_postal_code),
      formatDateForCSV(record.received_date),
      formatDateForCSV(record.decision_date),
      formatDateForCSV(record.begin_date),
      formatDateForCSV(record.end_date),
      escapeCsvValue(record.visa_class)
    ].join(','))
  ];

  // Create CSV content
  const csvContent = csvRows.join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `h1b_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Escapes CSV values to handle commas, quotes, and newlines
 */
function escapeCsvValue(value: string | null | undefined): string {
  if (!value) return '';
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Formats date for CSV export
 */
function formatDateForCSV(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return '';
  }
}

/**
 * Gets a summary of the export for user feedback
 */
export function getExportSummary(recordCount: number, filters?: any): string {
  let summary = `Exported ${recordCount.toLocaleString()} H1B records`;
  
  if (filters) {
    const activeFilters = [];
    if (filters.employer) activeFilters.push(`Employer: ${filters.employer}`);
    if (filters.status) activeFilters.push(`Status: ${filters.status}`);
    if (filters.jobTitle) activeFilters.push(`Job Title: ${filters.jobTitle}`);
    if (filters.minSalary) activeFilters.push(`Min Salary: $${filters.minSalary.toLocaleString()}`);
    if (filters.maxSalary) activeFilters.push(`Max Salary: $${filters.maxSalary.toLocaleString()}`);
    if (filters.searchTerm) activeFilters.push(`Search: ${filters.searchTerm}`);
    
    if (activeFilters.length > 0) {
      summary += ` with filters: ${activeFilters.join(', ')}`;
    }
  }
  
  return summary;
}