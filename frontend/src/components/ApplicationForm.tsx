import React, { useState } from 'react';
import { applicationsApi } from '../services/api';
import type { ApplicationInsert, ApplicationStatus } from '../types/supabase';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

// Values must match the statuses the agent API and Dashboard use.
const STATUS_CHOICES: { value: ApplicationStatus; label: string }[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'oa', label: 'OA' },
  { value: 'vo', label: 'VO' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' }
];

type ApplicationFormData = Pick<ApplicationInsert, 'company_name' | 'job_title' | 'status' | 'notes'>;

interface ApplicationFormProps {
  onSuccess?: () => void;
}

export function ApplicationForm({ onSuccess }: ApplicationFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>({
    company_name: '',
    job_title: '',
    status: 'applied',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await applicationsApi.create({
        ...formData,
        job_link: '',
        company_link: '',
        date_applied: new Date().toISOString()
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to create application. Please try again.');
      console.error('Error creating application:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            name="company_name"
            id="company_name"
            required
            value={formData.company_name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            name="job_title"
            id="job_title"
            required
            value={formData.job_title}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            name="status"
            id="status"
            required
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41] sm:text-sm"
          >
            {STATUS_CHOICES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            id="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41] sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#861F41] focus:ring-offset-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-[#861F41] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#621531] focus:outline-none focus:ring-2 focus:ring-[#861F41] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Application'}
        </button>
      </div>
    </form>
  );
}
