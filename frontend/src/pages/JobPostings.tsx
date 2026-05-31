import { useState, useEffect } from 'react';
import { Search, Briefcase, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface JobPosting {
  id: string;
  company_name: string;
  title: string;
  locations?: string;
  date_posted?: string;
  terms?: string;
  active?: boolean;
  url?: string;
  source?: string;
  sponsorship?: string;
}

export function JobPostings() {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    const loadPostings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('jobgpt_jobposting')
          .select('id, company_name, title, locations, date_posted, terms, active, url, source, sponsorship')
          .order('date_posted', { ascending: false });

        if (filterActive !== null) {
          query = query.eq('active', filterActive);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setPostings((data || []) as JobPosting[]);
      } catch (error: any) {
        console.error('Error loading job postings:', error);
        setError('Failed to load job postings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPostings();
  }, [filterActive]);

  const filteredPostings = postings.filter(posting =>
    posting.company_name.toLowerCase().includes(search.toLowerCase()) ||
    posting.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861F41] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job postings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-8 w-8 text-[#861F41]" />
            <h1 className="text-4xl font-bold text-gray-900">Job Postings</h1>
          </div>
          <p className="mt-2 text-gray-600">Browse job postings from our database</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by company or job title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
                />
              </div>
            </div>

            {/* Active Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFilterActive(null)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterActive === null
                      ? 'bg-[#861F41] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterActive(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterActive === true
                      ? 'bg-[#861F41] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterActive(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterActive === false
                      ? 'bg-[#861F41] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredPostings.length} of {postings.length} job postings
        </div>

        {/* Job Postings List */}
        {filteredPostings.length > 0 ? (
          <div className="space-y-4">
            {filteredPostings.map((posting) => (
              <div key={posting.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">{posting.title}</h2>
                      {posting.active && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                      {posting.sponsorship && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Sponsorship Available
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3">{posting.company_name}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      {posting.locations && (
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <p>{posting.locations}</p>
                        </div>
                      )}
                      {posting.terms && (
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <p>{posting.terms}</p>
                        </div>
                      )}
                      {posting.source && (
                        <div>
                          <span className="font-medium text-gray-700">Source:</span>
                          <p>{posting.source}</p>
                        </div>
                      )}
                      {posting.date_posted && (
                        <div>
                          <span className="font-medium text-gray-700">Posted:</span>
                          <p>{new Date(posting.date_posted).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {posting.url && (
                      <a
                        href={posting.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#861F41] hover:text-[#621531] font-medium transition-colors"
                      >
                        View Posting
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {search ? 'No job postings found matching your search.' : 'No job postings available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
