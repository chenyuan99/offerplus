import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';

interface InternshipItem {
  title: string;
  company_name: string;
  location: string;
  url: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: InternshipItem[];
}

export const Internship: React.FC = () => {
  const [items, setItems] = useState<InternshipItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 100;

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<PaginatedResponse>(`/api/internships?page=${currentPage}`);
        setItems(response.data.results);
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
  }, [currentPage]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 mx-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 mx-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Tech Internships 2024 | Offers+"
        description="Find and track the latest tech internships for 2024. Browse through hundreds of internship opportunities at top tech companies and startups."
        keywords="tech internships, software internships, 2024 internships, summer internships, tech companies"
        type="article"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <Link
            to="/add-application"
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
          >
            Add New Record
          </Link>
          <Link
            to="/hardware"
            className="px-4 py-2 text-cyan-600 border border-cyan-600 rounded hover:bg-cyan-50"
          >
            Hardware Jobs
          </Link>
          <a
            href="https://icc.fyi"
            className="px-4 py-2 text-cyan-600 border border-cyan-600 rounded hover:bg-cyan-50"
            target="_blank"
            rel="noopener noreferrer"
          >
            IT Consulting Jobs
          </a>
        </div>

        {items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{item.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/company/${encodeURIComponent(item.company_name)}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {item.company_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={item.url}
                          className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="px-3 py-1 text-cyan-600 border border-cyan-600 rounded hover:bg-cyan-50 mr-2"
                          onClick={() => {/* TODO: Implement edit */}}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                          onClick={() => {/* TODO: Implement delete */}}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && renderPagination()}
          </>
        ) : (
          <p className="text-gray-500 text-center">No items found.</p>
        )}
      </div>
    </>
  );
};
