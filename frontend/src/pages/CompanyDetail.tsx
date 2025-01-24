import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!companyName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Company not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-6">
        <CompanyLogo companyName={companyName} size={64} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
          <a
            href={`https://${getCompanyDomain(companyName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Visit Website
          </a>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <Link
          to="/add-application"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Add New Record
        </Link>
        <button
          className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50"
        >
          Request Referral
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outcome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Title
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
            {applications.map((application) => (
              <tr key={application.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${application.outcome.includes('REJECT')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {application.outcome}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {application.job_title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {application.application_link && (
                    <a
                      href={application.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    to={`/application/${application.id}/edit`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this application?')) {
                        jobsDb.delete(application.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
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
  );
}
