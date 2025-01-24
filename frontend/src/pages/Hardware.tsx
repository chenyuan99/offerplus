import React from 'react';
import { Helmet } from 'react-helmet';

export function Hardware() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Hardware Community | Offers+</title>
        <meta name="description" content="Hardwarers Help Hardwarers (HHH) Community - A platform for hardware professionals to connect and share resources" />
      </Helmet>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Hardwarers Help Hardwarers (HHH)
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Join our community of hardware professionals helping each other succeed
          </p>
          <a
            href="https://docs.google.com/spreadsheets/d/1GiaXXATvIwexrNOyqmil6RQ96ACjrICuxPcJu3IySP4/edit#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Contribute to the List
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              className="airtable-embed w-full h-[600px] border border-gray-200"
              src="https://airtable.com/embed/shr7au5VN60LMqm3h?backgroundColor=green&viewControls=on"
              frameBorder="0"
              title="Hardware Community Data"
              style={{ background: 'transparent' }}
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Join our community to connect with fellow hardware professionals and share resources</p>
        </div>
      </div>
    </div>
  );
}
