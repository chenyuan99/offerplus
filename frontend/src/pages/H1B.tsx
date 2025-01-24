import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'tableau-viz': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export function H1B() {
  useEffect(() => {
    // Load Tableau script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://bigdataanalyticspub-sb.uscis.dhs.gov/javascripts/api/tableau.embedding.3.latest.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>H1B Employer Data Hub | Offers+</title>
        <meta name="description" content="Explore H1B visa employer data and statistics" />
      </Helmet>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            H1B Employer Data Hub
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Explore comprehensive H1B visa data and employer statistics provided by USCIS
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
