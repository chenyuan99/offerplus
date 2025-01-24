import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApplicationRecord } from '../types';
import { jobsDb } from '../lib/db';
import { CompanyLogo } from '../components/CompanyLogo';

export function Companies() {
  const [companies, setCompanies] = useState<{ name: string; applicationCount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await jobsDb.init();
        const applications = await jobsDb.getAll();
        
        // Group applications by company and count them
        const companyGroups = applications.reduce((acc, app) => {
          const companyName = app.company_name;
          if (!acc[companyName]) {
            acc[companyName] = 0;
          }
          acc[companyName]++;
          return acc;
        }, {} as Record<string, number>);

        // Convert to array and sort by company name
        const companyList = Object.entries(companyGroups)
          .map(([name, count]) => ({
            name,
            applicationCount: count
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setCompanies(companyList);
      } catch (error: any) {
        console.error('Error loading companies:', error);
        setError('Failed to load companies. Please try again later.');
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
                <CompanyLogo companyName={company.name} size={48} />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
                  <p className="text-sm text-gray-500">
                    {company.applicationCount} application{company.applicationCount !== 1 ? 's' : ''}
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
