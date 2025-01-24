import React, { useState, useEffect } from 'react';
import { JobList } from '../components/JobList';
import { JobForm } from '../components/JobForm';
import { ApplicationRecord } from '../types';
import { Plus, Search, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { jobsDb } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CompanyLogo } from '../components/CompanyLogo';

const ITEMS_PER_PAGE = 10;

export function Dashboard() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const outcomeFilter = searchParams.get('outcome') || '';

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await jobsDb.init();
        const loadedApplications = await jobsDb.getAll();
        setApplications(loadedApplications);
      } catch (error: any) {
        console.error('Error loading applications:', error);
        if (error?.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load applications. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadApplications();
    }
  }, [user, navigate]);

  const handleAddApplication = async (newApplication: Omit<ApplicationRecord, 'id' | 'created' | 'updated' | 'applicant'>) => {
    try {
      setError(null);
      const id = await jobsDb.add(newApplication);
      const applications = await jobsDb.getAll();
      setApplications(applications);
      setShowForm(false);
    } catch (error: any) {
      console.error('Error adding application:', error);
      if (error?.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to add application. Please try again later.');
      }
    }
  };

  const handleUpdateApplication = async (application: ApplicationRecord) => {
    try {
      setError(null);
      await jobsDb.update(application);
      const applications = await jobsDb.getAll();
      setApplications(applications);
      setSelectedApplication(null);
    } catch (error: any) {
      console.error('Error updating application:', error);
      if (error?.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to update application. Please try again later.');
      }
    }
  };

  const handleDeleteApplication = async (id: number) => {
    try {
      setError(null);
      await jobsDb.delete(id);
      const applications = await jobsDb.getAll();
      setApplications(applications);
    } catch (error: any) {
      console.error('Error deleting application:', error);
      if (error?.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to delete application. Please try again later.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.company_name.toLowerCase().includes(search.toLowerCase()) ||
      app.job_title.toLowerCase().includes(search.toLowerCase());
    
    const matchesOutcome = !outcomeFilter || app.outcome.toLowerCase() === outcomeFilter.toLowerCase();
    
    return matchesSearch && matchesOutcome;
  });

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    total: applications.length,
    rejected: applications.filter(app => app.outcome === 'REJECTED').length,
    oa: applications.filter(app => app.outcome === 'OA').length,
    vo: applications.filter(app => app.outcome === 'VO').length,
    offer: applications.filter(app => app.outcome === 'OFFER').length
  };

  const handleOutcomeFilter = (outcome: string) => {
    setSearchParams(outcome ? { outcome: outcome.toLowerCase() } : {});
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Application
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => handleOutcomeFilter('')}
          className={`px-4 py-2 rounded-lg ${!outcomeFilter ? 'bg-gray-200' : 'bg-white border border-gray-300'}`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => handleOutcomeFilter('REJECTED')}
          className={`px-4 py-2 rounded-lg ${outcomeFilter === 'rejected' ? 'bg-red-200' : 'bg-white border border-gray-300'}`}
        >
          Rejected ({stats.rejected})
        </button>
        <button
          onClick={() => handleOutcomeFilter('OA')}
          className={`px-4 py-2 rounded-lg ${outcomeFilter === 'oa' ? 'bg-yellow-200' : 'bg-white border border-gray-300'}`}
        >
          OA ({stats.oa})
        </button>
        <button
          onClick={() => handleOutcomeFilter('VO')}
          className={`px-4 py-2 rounded-lg ${outcomeFilter === 'vo' ? 'bg-blue-200' : 'bg-white border border-gray-300'}`}
        >
          VO ({stats.vo})
        </button>
        <button
          onClick={() => handleOutcomeFilter('OFFER')}
          className={`px-4 py-2 rounded-lg ${outcomeFilter === 'offer' ? 'bg-green-200' : 'bg-white border border-gray-300'}`}
        >
          Offer ({stats.offer})
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search applications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedApplications.map((application) => (
              <tr key={application.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${application.outcome === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    application.outcome === 'OA' ? 'bg-yellow-100 text-yellow-800' :
                    application.outcome === 'VO' ? 'bg-blue-100 text-blue-800' :
                    application.outcome === 'OFFER' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'}`}>
                    {application.outcome}
                  </span>
                </td>
                <td className="px-6 py-4">{application.job_title}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <CompanyLogo companyName={application.company_name} size={40} />
                    <div>
                      <a href={`/company/${application.company_name}`} className="text-blue-600 hover:text-blue-900">
                        {application.company_name}
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => setSelectedApplication(application)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteApplication(application.id)}
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {(showForm || selectedApplication) && (
        <JobForm 
          onSubmit={selectedApplication ? handleUpdateApplication : handleAddApplication}
          onClose={() => {
            setShowForm(false);
            setSelectedApplication(null);
          }}
          initialData={selectedApplication || undefined}
          mode={selectedApplication ? 'edit' : 'create'}
        />
      )}
    </div>
  );
}
