import React from 'react';
import { ApplicationForm } from '../components/ApplicationForm';

export function AddApplication() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Add New Application</h1>
          <p className="mt-2 text-gray-600">Track a new job application</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 sm:p-8">
          <ApplicationForm />
        </div>
      </div>
    </div>
  );
}
