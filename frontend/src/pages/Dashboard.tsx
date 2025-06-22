import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, BarChart3, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { ApplicationRecord, ApplicationStatus } from '../types';
import { supabase } from '../lib/supabase';

const ITEMS_PER_PAGE = 10;

export function Dashboard() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);
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
      // For now, we'll just refresh the applications
      // In the future, you might want to implement Gmail sync with Supabase Edge Functions
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="Toggle Statistics"
          >
            <BarChart3 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={syncGmail}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Mail className="h-5 w-5" />
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </button>

          <button
            onClick={() => navigate('/add')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-5 w-5" />
            Add Application
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showStats && (
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="p-4 bg-blue-100 rounded-lg">
            <div className="text-sm text-blue-600">Active</div>
            <div className="text-2xl font-semibold">{stats.active}</div>
          </div>
          <div className="p-4 bg-purple-100 rounded-lg">
            <div className="text-sm text-purple-600">Applied</div>
            <div className="text-2xl font-semibold">{stats.applied}</div>
          </div>
          <div className="p-4 bg-indigo-100 rounded-lg">
            <div className="text-sm text-indigo-600">OA</div>
            <div className="text-2xl font-semibold">{stats.oa}</div>
          </div>
          <div className="p-4 bg-yellow-100 rounded-lg">
            <div className="text-sm text-yellow-600">VO</div>
            <div className="text-2xl font-semibold">{stats.vo}</div>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <div className="text-sm text-green-600">Offers</div>
            <div className="text-2xl font-semibold">{stats.offer}</div>
          </div>
          <div className="p-4 bg-red-100 rounded-lg">
            <div className="text-sm text-red-600">Rejected</div>
            <div className="text-2xl font-semibold">{stats.rejected}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company & Position
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied On
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedApplications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img 
                        className="h-10 w-10 rounded-full" 
                        src={`https://logo.clearbit.com/${app.company_link ? new URL(app.company_link).hostname.replace('www.', '') : 'company'}.com`} 
                        alt="Company"
                        onError={(e) => {
                          // Use a base64-encoded SVG as fallback
                          const svg = `data:image/svg+xml;base64,${btoa(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="%23e5e7eb">
                              <rect width="40" height="40" rx="20" />
                              <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" dy=".3em" fill="%239ca3af">
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
                          <a href={app.company_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {new URL(app.company_link).hostname.replace('www.', '')}
                          </a>
                        ) : 'Company'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.job_link ? (
                          <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {app.job_title}
                          </a>
                        ) : app.job_title}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(app.date_applied).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => navigate(`/edit/${app.id}`)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1 text-gray-600 disabled:text-gray-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1 text-gray-600 disabled:text-gray-400"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
