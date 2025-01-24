import React from 'react';
import { ApplicationRecord, ApplicationOutcome } from '../types';

interface JobFormProps {
  application?: ApplicationRecord;
  onSubmit: (data: Omit<ApplicationRecord, 'id' | 'created' | 'updated' | 'applicant'>) => void;
  onCancel: () => void;
}

const OUTCOMES: ApplicationOutcome[] = [
  'TO DO',
  'IN PROGRESS',
  'REFER',
  'REJECT(Resume)',
  'REJECT(VO)',
  'REJECT(OA)',
  'VO',
  'OA'
];

export function JobForm({ application, onSubmit, onCancel }: JobFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    onSubmit({
      job_title: formData.get('job_title') as string,
      company_name: formData.get('company_name') as string,
      outcome: formData.get('outcome') as ApplicationOutcome,
      application_link: formData.get('application_link') as string,
      OA_date: formData.get('OA_date') as string || null,
      VO_date: formData.get('VO_date') as string || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {application ? 'Edit Application' : 'Add New Application'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              name="job_title"
              defaultValue={application?.job_title}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              type="text"
              name="company_name"
              defaultValue={application?.company_name}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="outcome"
              defaultValue={application?.outcome || 'TO DO'}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {OUTCOMES.map(outcome => (
                <option key={outcome} value={outcome}>
                  {outcome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Application Link</label>
            <input
              type="url"
              name="application_link"
              defaultValue={application?.application_link}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">OA Date</label>
            <input
              type="date"
              name="OA_date"
              defaultValue={application?.OA_date?.split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">VO Date</label>
            <input
              type="date"
              name="VO_date"
              defaultValue={application?.VO_date?.split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {application ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}