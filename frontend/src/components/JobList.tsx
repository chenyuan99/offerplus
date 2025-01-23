import React from 'react';
import { JobApplication } from '../types';
import { FileText, Building2, MapPin, Briefcase } from 'lucide-react';

interface JobListProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
}

export function JobList({ jobs, onSelectJob }: JobListProps) {
  return (
    <div className="overflow-auto h-[calc(100vh-12rem)]">
      {jobs.map((job) => (
        <div
          key={job.id}
          onClick={() => onSelectJob(job)}
          className="bg-white p-4 rounded-lg shadow mb-3 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{job.role || 'Untitled Role'}</h3>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <Building2 size={16} />
                <span>{job.company}</span>
              </div>
              {job.location && (
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <MapPin size={16} />
                  <span>{job.location}</span>
                </div>
              )}
              {job.industry && (
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <Briefcase size={16} />
                  <span>{job.industry}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end">
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
              <span className="text-sm text-gray-500 mt-2">{job.process}</span>
            </div>
          </div>
          {job.notes && (
            <div className="flex items-center gap-2 mt-2 text-gray-500">
              <FileText size={16} />
              <span className="text-sm truncate">{job.notes}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Applied':
      return 'bg-blue-100 text-blue-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Offer':
      return 'bg-green-100 text-green-800';
    case 'Accepted':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}