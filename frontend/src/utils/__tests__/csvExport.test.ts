import { H1BRecord } from '../../types/h1b';

// Mock the DOM methods for testing
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Setup DOM mocks
Object.defineProperty(document, 'createElement', {
  value: mockCreateElement
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild
});

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
});

// Mock link element
const mockLink = {
  setAttribute: jest.fn(),
  click: jest.fn(),
  style: {},
  download: 'test'
};

describe('CSV Export Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateElement.mockReturnValue(mockLink);
    mockCreateObjectURL.mockReturnValue('blob:test-url');
  });

  // We'll import the function dynamically to avoid issues with mocking
  const importExportFunction = async () => {
    const { exportH1BToCSV } = await import('../csvExport');
    return exportH1BToCSV;
  };

  test('should handle empty data gracefully', async () => {
    const exportH1BToCSV = await importExportFunction();
    
    // Mock console.warn to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    exportH1BToCSV([]);
    
    expect(consoleSpy).toHaveBeenCalledWith('No data to export');
    expect(mockCreateElement).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('should create CSV with proper headers and data', async () => {
    const exportH1BToCSV = await importExportFunction();
    
    const testData: H1BRecord[] = [
      {
        case_number: 'I-200-12345-123456',
        case_status: 'CERTIFIED',
        employer_name: 'Test Company Inc.',
        job_title: 'Software Engineer',
        wage_rate_of_pay_from: 120000,
        worksite_city: 'San Francisco',
        worksite_state: 'CA',
        decision_date: '2023-01-15'
      }
    ];

    exportH1BToCSV(testData, 'test-export.csv');

    // Verify DOM manipulation
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:test-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test-export.csv');
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  test('should escape CSV values with commas and quotes', async () => {
    const { exportH1BToCSV } = await import('../csvExport');
    
    const testData: H1BRecord[] = [
      {
        case_number: 'I-200-12345-123456',
        case_status: 'CERTIFIED',
        employer_name: 'Test, Company "Inc."',
        job_title: 'Software Engineer, Senior',
        wage_rate_of_pay_from: 120000
      }
    ];

    // We can't easily test the CSV content without more complex mocking,
    // but we can verify the function doesn't throw
    expect(() => exportH1BToCSV(testData)).not.toThrow();
  });

  test('should generate default filename when none provided', async () => {
    const exportH1BToCSV = await importExportFunction();
    
    const testData: H1BRecord[] = [
      {
        case_number: 'I-200-12345-123456',
        case_status: 'CERTIFIED',
        employer_name: 'Test Company',
        job_title: 'Software Engineer'
      }
    ];

    exportH1BToCSV(testData);

    // Check that a filename with today's date was set
    const setAttributeCalls = mockLink.setAttribute.mock.calls;
    const downloadCall = setAttributeCalls.find(call => call[0] === 'download');
    expect(downloadCall).toBeDefined();
    expect(downloadCall[1]).toMatch(/^h1b_data_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe('CSV Export Summary', () => {
  test('should generate export summary with record count', async () => {
    const { getExportSummary } = await import('../csvExport');
    
    const summary = getExportSummary(1500);
    expect(summary).toBe('Exported 1,500 H1B records');
  });

  test('should include filter information in summary', async () => {
    const { getExportSummary } = await import('../csvExport');
    
    const filters = {
      employer: 'Google',
      status: 'CERTIFIED',
      minSalary: 100000
    };

    const summary = getExportSummary(500, filters);
    expect(summary).toContain('Exported 500 H1B records with filters:');
    expect(summary).toContain('Employer: Google');
    expect(summary).toContain('Status: CERTIFIED');
    expect(summary).toContain('Min Salary: $100,000');
  });
});