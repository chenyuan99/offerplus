import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import { H1BViewerNative } from '../components/h1b/H1BViewerNative';
import { H1BViewerCached } from '../components/h1b/H1BViewerCached';
import '../styles/animations.css';

// Tableau viz component type declaration
interface TableauVizProps extends React.HTMLAttributes<HTMLElement> {
  src?: string;
  'hide-tabs'?: boolean;
  toolbar?: string;
  device?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'tableau-viz': TableauVizProps;
    }
  }
}

export function H1B() {
  const [viewMode, setViewMode] = useState<'cached' | 'native' | 'tableau'>('cached');

  return (
    <>
      <Helmet>
        <title>H1B Visa Data Explorer | Offers+</title>
        <meta name="description" content="Explore comprehensive H1B visa application data with advanced filtering, search, and analytics capabilities." />
      </Helmet>
      <SEO
        title="H1B Data Explorer | Offers+"
        description="Interactive H1B visa data explorer with advanced filtering, search, and analytics. Find H1B sponsorship trends, salary data, and employer statistics."
        keywords="H1B data, H1B sponsorship, H1B salary, H1B statistics, visa data, immigration data, H1B employers"
        type="article"
      />

      {/* View Mode Toggle */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('cached')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'cached'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                🚀 Cached Explorer
              </button>
              <button
                type="button"
                onClick={() => setViewMode('native')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'native'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Native Explorer
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tableau')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'tableau'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                USCIS Tableau Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="fade-in-up">
        {viewMode === 'cached' ? (
          <H1BViewerCached />
        ) : viewMode === 'native' ? (
          <H1BViewerNative />
        ) : (
          <TableauView />
        )}
      </div>
    </>
  );
}

// Tableau View Component (original functionality)
function TableauView() {
  React.useEffect(() => {
    // Load Tableau script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://bigdataanalyticspub-sb.uscis.dhs.gov/javascripts/api/tableau.embedding.3.latest.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            H1B Employer Data Hub
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Official USCIS H1B visa data and employer statistics
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-w-16 aspect-h-9">
            <tableau-viz
              id="tableau-viz"
              src="https://bigdataanalyticspub-sb.uscis.dhs.gov/views/H1BEmployerDataHub-Final/H1B-EmployerDataHub"
              hide-tabs
              toolbar="bottom"
              device="default"
              className="w-full h-full"
            />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data source: U.S. Citizenship and Immigration Services (USCIS)</p>
        </div>
      </div>
    </div>
  );
}
