import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CompanyLogo } from '../components/CompanyLogo';

interface Company {
  id: string;
  name: string;
  website?: string;
  application_count: number;
}


export function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get all unique companies from applications
        const { data: applicationsData, error: appsError } = await supabase
          .from('applications')
          .select('company_name, company_link')
          .neq('company_name', null)
          .returns<Array<{ company_name: string; company_link: string | null }>>();

        if (appsError) throw appsError;

        if (!applicationsData || applicationsData.length === 0) {
          setCompanies([]);
          return;
        }

        // Count applications per company and extract unique companies
        const companyMap = new Map<string, { name: string; website?: string; count: number }>();

        applicationsData.forEach(app => {
          const name = app.company_name || 'Unknown';
          const existing = companyMap.get(name) || { name, website: app.company_link || undefined, count: 0 };
          companyMap.set(name, {
            ...existing,
            count: existing.count + 1
          });
        });

        // Convert to array and sort by application count
        const companyList = Array.from(companyMap.values())
          .map((company, index) => ({
            id: `company_${index}`,
            name: company.name,
            website: company.website,
            application_count: company.count
          }))
          .sort((a, b) => b.application_count - a.application_count);

        setCompanies(companyList);
      } catch (error) {
        console.error('Error loading companies:', error);
        setError(error instanceof Error ? error.message : 'Failed to load companies. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861F41] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-gray-600">Track your applications by company</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
            />
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link
                key={company.id}
                to={`/company/${encodeURIComponent(company.name)}`}
                className="group bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Logo */}
                  <div className="mb-4 flex justify-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                      <CompanyLogo
                        companyName={company.name}
                        companyLink={company.website}
                        size={56}
                        className="rounded-full"
                      />
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#861F41] transition-colors">
                      {company.name}
                    </h2>
                    <div className="mt-3 flex items-center justify-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>{company.application_count} application{company.application_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {search ? 'No companies found matching your search.' : 'No companies found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
