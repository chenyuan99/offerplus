import React from 'react';
import { ApplicationForm } from '../components/ApplicationForm';

export function AddApplication() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Add New Application
          </h2>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <ApplicationForm />
      </div>
    </div>
  );
}
