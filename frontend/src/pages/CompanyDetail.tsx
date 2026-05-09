import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { ApplicationRecord, Company } from '../types';
import { jobsDb } from '../lib/db';
import { CompanyLogo } from '../components/CompanyLogo';
import { getCompanyDomain } from '../utils/companyLogo';

export function CompanyDetail() {
  const { companyName } = useParams<{ companyName: string }>();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      if (!companyName) return;
      
      try {
        setIsLoading(true);
        setError(null);
        await jobsDb.init();
        const allApplications = await jobsDb.getAll();
        const companyApplications = allApplications.filter(
          app => app.company_name.toLowerCase() === companyName.toLowerCase()
        );
        setApplications(companyApplications);
      } catch (error: any) {
        console.error('Error loading applications:', error);
        setError('Failed to load applications. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, [companyName]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861F41] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!companyName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Company not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <CompanyLogo companyName={companyName} size={64} />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{companyName}</h1>
              <a
                href={`https://${getCompanyDomain(companyName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#861F41] hover:text-[#621531] transition-colors"
              >
                Visit Website
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/add-application"
              className="inline-flex items-center px-4 py-2 bg-[#861F41] text-white rounded-md hover:bg-[#621531] transition-colors font-medium"
            >
              Add New Application
            </Link>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Request Referral
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Outcome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${application.outcome.includes('REJECT')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                        }`}
                    >
                      {application.outcome}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.job_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {application.application_link && (
                      <a
                        href={application.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#861F41] hover:text-[#621531] transition-colors font-medium"
                      >
                        View
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link
                      to={`/application/${application.id}/edit`}
                      className="text-[#861F41] hover:text-[#621531] transition-colors font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this application?')) {
                          jobsDb.delete(application.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
