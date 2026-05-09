import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, BarChart3, ChevronLeft, ChevronRight, Mail, AlertCircle } from 'lucide-react';
import { ApplicationRecord, ApplicationStatus } from '../types';
import { supabase } from '../lib/supabase';

const ITEMS_PER_PAGE = 10;

export function Dashboard() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const statusFilter = new URLSearchParams(location.search).get('status') as ApplicationStatus | null;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('date_applied', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncGmail = async () => {
    setSyncing(true);
    try {
      await fetchApplications();
    } catch (err) {
      setError('Failed to sync with Gmail');
      console.error('Error syncing with Gmail:', err);
    } finally {
      setSyncing(false);
    }
  };

  const calculateStats = () => {
    const statusCounts = applications.reduce(
      (acc, app) => ({
        ...acc,
        [app.status]: (acc[app.status] || 0) + 1,
      }),
      {} as Record<ApplicationStatus, number>
    );

    const totalApplications = applications.length;
    const activeApplications = applications.filter(
      (app) => app.status !== 'rejected' && app.status !== 'offer'
    ).length;

    return {
      total: totalApplications,
      active: activeApplications,
      applied: statusCounts['applied'] || 0,
      oa: statusCounts['oa'] || 0,
      vo: statusCounts['vo'] || 0,
      offer: statusCounts['offer'] || 0,
      rejected: statusCounts['rejected'] || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861F41] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.job_title.toLowerCase().includes(search.toLowerCase()) ||
        app.company_link.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime());

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = calculateStats();

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'vo':
        return 'bg-yellow-100 text-yellow-800';
      case 'oa':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Job Applications</h1>
          <p className="mt-2 text-gray-600">Track and manage your job applications</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Section */}
        {showStats && applications.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <StatCard label="Total" value={stats.total} color="gray" />
              <StatCard label="Active" value={stats.active} color="blue" />
              <StatCard label="Applied" value={stats.applied} color="purple" />
              <StatCard label="OA" value={stats.oa} color="indigo" />
              <StatCard label="VO" value={stats.vo} color="yellow" />
              <StatCard label="Offers" value={stats.offer} color="green" />
              <StatCard label="Rejected" value={stats.rejected} color="red" />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Toggle Statistics"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Stats</span>
            </button>

            <button
              onClick={syncGmail}
              disabled={syncing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span className="text-sm font-medium">{syncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <button
              onClick={() => navigate('/add-application')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#861F41] text-white rounded-md hover:bg-[#621531] transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {paginatedApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Company & Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={app.company_link ? (() => {
                                const hostname = new URL(app.company_link).hostname.replace('www.', '');
                                const domain = hostname.split('.').slice(-2).join('.');
                                return `https://img.logo.dev/${domain}`;
                              })() : 'https://img.logo.dev/company'}
                              alt="Company"
                              onError={(e) => {
                                const svg = `data:image/svg+xml;base64,${btoa(
                                  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="%23e5e7eb">
                                    <rect width="40" height="40" rx="20" />
                                    <text x="50%" y="50%" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" dy=".3em" fill="%239ca3af">
                                      ${app.company_link ? new URL(app.company_link).hostname.substring(0, 2).toUpperCase() : 'CO'}
                                    </text>
                                  </svg>`
                                )}`;
                                (e.target as HTMLImageElement).src = svg;
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {app.company_link ? (
                                <a href={app.company_link} target="_blank" rel="noopener noreferrer" className="hover:text-[#861F41] transition-colors">
                                  {new URL(app.company_link).hostname.replace('www.', '')}
                                </a>
                              ) : 'Company'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {app.job_link ? (
                                <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:text-[#861F41] transition-colors">
                                  {app.job_title}
                                </a>
                              ) : app.job_title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                          {app.status.replace('_', ' ').charAt(0).toUpperCase() + app.status.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(app.date_applied).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/edit/${app.id}`)}
                          className="text-[#861F41] font-medium hover:text-[#621531] transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">No applications found</p>
              <button
                onClick={() => navigate('/add-application')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#861F41] text-white rounded-md hover:bg-[#621531] transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Add your first application
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous</span>
            </button>

            <span className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 rounded-md transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'purple' | 'indigo' | 'yellow' | 'green' | 'red';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  };

  const textClasses = {
    gray: 'text-gray-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
    indigo: 'text-indigo-700',
    yellow: 'text-yellow-700',
    green: 'text-green-700',
    red: 'text-red-700',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{label}</p>
      <p className={`${textClasses[color]} text-2xl font-bold`}>{value}</p>
    </div>
  );
}
