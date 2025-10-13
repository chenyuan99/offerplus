import React, { useState } from 'react';
import { createH1BFilterUrl } from '../../hooks/useUrlFilters';

interface ExampleFilter {
  name: string;
  description: string;
  filters: any;
}

const exampleFilters: ExampleFilter[] = [
  {
    name: 'Google Software Engineers',
    description: 'H1B applications from Google for software engineering roles',
    filters: {
      employer: 'Google',
      searchTerm: 'software engineer'
    }
  },
  {
    name: 'High Salary Tech Jobs',
    description: 'Tech positions with salaries above $150,000',
    filters: {
      minSalary: 150000,
      searchTerm: 'software'
    }
  },
  {
    name: 'Certified Applications',
    description: 'All certified H1B applications',
    filters: {
      status: 'CERTIFIED'
    }
  },
  {
    name: 'Data Science Roles',
    description: 'Data scientist and analyst positions',
    filters: {
      jobTitle: 'Data Scientist'
    }
  },
  {
    name: 'Microsoft Engineers $120K+',
    description: 'Microsoft engineering roles with minimum $120K salary',
    filters: {
      employer: 'Microsoft',
      minSalary: 120000,
      searchTerm: 'engineer'
    }
  }
];

export function H1BUrlExamples() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExampleClick = (filters: any) => {
    const url = createH1BFilterUrl(filters);
    window.location.href = url;
  };

  const copyExampleUrl = (filters: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const url = createH1BFilterUrl(filters);
    navigator.clipboard.writeText(url).then(() => {
      console.log('Example URL copied:', url);
    }).catch(err => {
      console.error('Failed to copy URL:', err);
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-sm font-medium text-blue-800">URL Filter Examples</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isExpanded ? 'Hide Examples' : 'Show Examples'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-blue-700 mb-3">
            Click any example to apply those filters, or copy the URL to share specific filter combinations:
          </p>
          
          {exampleFilters.map((example, index) => (
            <div
              key={index}
              className="bg-white rounded-md p-3 border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => handleExampleClick(example.filters)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{example.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{example.description}</div>
                  <div className="text-xs text-blue-600 mt-1 font-mono">
                    {createH1BFilterUrl(example.filters).replace(window.location.origin, '')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => copyExampleUrl(example.filters, e)}
                  className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}

          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Supported URL Parameters:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><code className="bg-gray-200 px-1 rounded">?employer=Google</code> - Filter by employer name</div>
              <div><code className="bg-gray-200 px-1 rounded">?status=CERTIFIED</code> - Filter by case status</div>
              <div><code className="bg-gray-200 px-1 rounded">?jobTitle=Software Engineer</code> - Filter by job title</div>
              <div><code className="bg-gray-200 px-1 rounded">?search=engineer</code> - Text search across fields</div>
              <div><code className="bg-gray-200 px-1 rounded">?minSalary=120000</code> - Minimum salary filter</div>
              <div><code className="bg-gray-200 px-1 rounded">?maxSalary=200000</code> - Maximum salary filter</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Combine multiple parameters with &amp; (e.g., <code>?employer=Google&minSalary=150000</code>)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}