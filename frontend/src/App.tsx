import React, { useState, useEffect } from 'react';
import { JobList } from './components/JobList';
import { JobForm } from './components/JobForm';
import { JobApplication } from './types';
import { Plus, Search, BarChart3 } from 'lucide-react';
import { jobsDb } from './lib/db';
import { mockJobs } from './lib/mockData';

function App() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize database and load jobs
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        await jobsDb.init();
        const loadedJobs = await jobsDb.getAll();
        
        // If no jobs exist, add mock data
        if (loadedJobs.length === 0) {
          for (const job of mockJobs) {
            await jobsDb.add(job);
          }
          const initialJobs = await jobsDb.getAll();
          setJobs(initialJobs);
        } else {
          setJobs(loadedJobs);
        }
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadJobs();
  }, []);

  const handleAddJob = async (newJob: Omit<JobApplication, 'id'>) => {
    try {
      const id = await jobsDb.add(newJob);
      const job: JobApplication = { ...newJob, id };
      setJobs(prev => [job, ...prev]);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding job:', error);
    }
  };

  const handleUpdateJob = async (updatedJob: JobApplication) => {
    try {
      if (!updatedJob.id) {
        throw new Error('Job ID is required for update');
      }

      // Ensure all required fields are present and properly typed
      const jobToUpdate: JobApplication = {
        id: updatedJob.id,
        role: updatedJob.role || '',
        company: updatedJob.company || '',
        location: updatedJob.location || '',
        industry: updatedJob.industry || '',
        poc: updatedJob.poc || '',
        agent: updatedJob.agent || '',
        process: updatedJob.process || 'Resume',
        appliedDate: updatedJob.appliedDate || new Date().toISOString().split('T')[0],
        status: updatedJob.status || 'Applied',
        notes: updatedJob.notes || ''
      };

      await jobsDb.update(jobToUpdate);
      
      setJobs(prev => prev.map(job => 
        job.id === jobToUpdate.id ? jobToUpdate : job
      ));
      setSelectedJob(null);
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const handleSelectJob = (job: JobApplication) => {
    setSelectedJob(job);
  };

  const filteredJobs = jobs.filter(job => 
    job.company.toLowerCase().includes(search.toLowerCase()) ||
    job.role.toLowerCase().includes(search.toLowerCase()) ||
    job.industry.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: jobs.length,
    active: jobs.filter(job => job.status === 'In Progress').length,
    offers: jobs.filter(job => job.status === 'Offer').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Search Tracker</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Application
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <BarChart3 size={24} className="text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Applications</p>
                <p className="text-2xl font-semibold">{stats.active}</p>
              </div>
              <BarChart3 size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offers</p>
                <p className="text-2xl font-semibold">{stats.offers}</p>
              </div>
              <BarChart3 size={24} className="text-green-500" />
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <JobList jobs={filteredJobs} onSelectJob={handleSelectJob} />

        {(showForm || selectedJob) && (
          <JobForm 
            onSubmit={selectedJob ? handleUpdateJob : handleAddJob}
            onClose={() => {
              setShowForm(false);
              setSelectedJob(null);
            }}
            initialData={selectedJob || undefined}
            mode={selectedJob ? 'edit' : 'create'}
          />
        )}
      </div>
    </div>
  );
}

export default App;