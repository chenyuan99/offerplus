import React, { useState, useEffect } from 'react';
import { apiService, UserProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const Resume: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await apiService.getUserProfile();
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await apiService.uploadResume(file);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError('Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await apiService.deleteResume();
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError('Failed to delete resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Resume Management</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {profile?.resume_url ? (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Current Resume:</p>
          <div className="flex items-center justify-between mt-2">
            <a
              href={profile.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profile.resume_name}
            </a>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {new Date(profile.resume_updated_at!).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <p className="mb-4 text-gray-600">No resume uploaded yet</p>
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          {profile?.resume ? 'Update Resume' : 'Upload Resume'}
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          disabled={loading}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Accepted formats: PDF, DOC, DOCX (max 5MB)
        </p>
      </div>

      {loading && (
        <div className="mt-4 text-center text-gray-600">
          Processing...
        </div>
      )}
    </div>
  );
};
