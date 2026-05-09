import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CompanyLogo } from '../components/CompanyLogo';
import { supabase } from '../lib/supabase';

interface Company {
  id: string;
  name: string;
  logo_url?: string;
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

        // First, get all companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('tracks_company')
          .select('id, name, logo_url, website')
          .order('name')
          .returns<Array<{
            id: string;
            name: string;
            logo_url: string | null;
            website: string | null;
          }>>();

        if (companiesError) throw companiesError;

        // Type guard to ensure we have the expected data structure
        if (!companiesData || companiesData.length === 0) {
          setCompanies([]);
          return;
        }


        // Get application counts per company
        const { data: applicationsData, error: appsError } = await supabase
          .from('applications')
          .select('company_id')
          .not('company_id', 'is', null)
          .returns<Array<{ company_id: string }>>();

        if (appsError) {
          console.error('Error fetching applications:', appsError);
        }

        // Count applications per company
        const applicationCountMap = new Map<string, number>();
        if (applicationsData) {
          applicationsData.forEach(app => {
            if (app.company_id) {
              applicationCountMap.set(
                app.company_id,
                (applicationCountMap.get(app.company_id) || 0) + 1
              );
            }
          });
        }

        // Combine company data with application counts
        const companyList = companiesData.map(company => ({
          id: company.id,
          name: company.name,
          logo_url: company.logo_url || undefined,
          application_count: applicationCountMap.get(company.id) || 0,
          website: company.website || undefined
        }));

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Companies</h1>
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Link
            key={company.name}
            to={`/company/${encodeURIComponent(company.name)}`}
            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <CompanyLogo companyName={company.name} size={48} className="rounded-full" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
                  <p className="text-sm text-gray-500">
                    {company.application_count} application{company.application_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          {search ? 'No companies found matching your search.' : 'No companies found.'}
        </div>
      )}
    </div>
  );
}
