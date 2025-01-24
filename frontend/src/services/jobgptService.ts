import axios from 'axios';
import { JobGPTResponse, ResumeUploadResponse, JobGPTMode } from '../types/jobgpt';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const jobgptService = {
  generatePrompt: async (prompt: string, mode: JobGPTMode): Promise<JobGPTResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/jobgpt/prompt`, {
        prompt,
        mode
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate prompt');
    }
  },

  uploadResume: async (file: File): Promise<ResumeUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await axios.post(`${API_URL}/api/jobgpt/resume/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to upload resume');
    }
  },

  matchResume: async (jobDescription: string, resumeUrl: string): Promise<JobGPTResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/jobgpt/resume/match`, {
        job_description: jobDescription,
        resume_url: resumeUrl,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to match resume');
    }
  },
};
