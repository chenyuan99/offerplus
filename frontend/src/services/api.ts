import axios from 'axios';
import { authService } from './auth';

// const API_URL = import.meta.env.VITE_API_URL || 'https://offerplus.io';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = authService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await authService.refreshToken();
      
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export interface Application {
  id?: number;
  outcome: string;
  job_title: string;
  company_name: string;
  application_link?: string;
  OA_date?: string;
  VO_date?: string;
  created?: string;
  updated?: string;
  applicant?: string;
}

// Auth API endpoints
export const authApi = {
  getUser: () => api.get('/api/auth/user/'),
  login: (credentials: { username: string; password: string }) =>
    api.post('/api/auth/login/', credentials),
  register: (userData: { username: string; email: string; password: string; password2: string }) =>
    api.post('/api/auth/register/', userData),
  refreshToken: (refresh: string) =>
    api.post('/api/auth/refresh/', { refresh }),
};

// Application API endpoints
export const applicationsApi = {
  list: () => api.get<Application[]>('/api/applications/'),
  create: (data: Application) => api.post<Application>('/api/applications/', data),
  get: (id: number) => api.get<Application>(`/api/applications/${id}/`),
  update: (id: number, data: Application) => api.put<Application>(`/api/applications/${id}/`, data),
  delete: (id: number) => api.delete(`/api/applications/${id}/`),
};

export interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  resume: string | null;
  resume_name: string | null;
  resume_updated_at: string | null;
  resume_url: string | null;
}

class ApiService {
  async getUserProfile(): Promise<UserProfile> {
    const response = await api.get('/api/profile/');
    return response.data;
  }

  async uploadResume(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.patch('/api/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async deleteResume(): Promise<UserProfile> {
    const response = await api.patch('/api/profile/', {
      resume: null,
      resume_name: null,
    });

    return response.data;
  }
}

export const apiService = new ApiService();

export default api;
