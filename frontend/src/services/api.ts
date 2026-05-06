import axios from 'axios';
import { authService } from './auth';
import { supabase } from '../lib/supabase';
import type { paths } from '../types/api';

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

// Auto-generated from OpenAPI spec
export type Application = paths['/api/applications/']['get']['responses']['200']['content']['application/json'][number];
export type ApplicationInput = paths['/api/applications/']['post']['requestBody']['content']['application/json'];

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

// Auto-generated from OpenAPI spec
export type UserProfile = paths['/api/profile/']['get']['responses']['200']['content']['application/json'];

class ApiService {
  async getUserProfile(): Promise<UserProfile> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Not authenticated');
    }

    // Try to get profile from database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist, create a basic one from auth user
    let profile = profileData;
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, use defaults
      profile = {
        id: user.id,
        resume: null,
        resume_name: null,
        resume_updated_at: null,
        resume_url: null,
      };
    } else if (profileError) {
      throw profileError;
    }

    return {
      id: profile.id,
      user: {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        email: user.email || '',
      },
      resume: profile.resume || null,
      resume_name: profile.resume_name || null,
      resume_updated_at: profile.resume_updated_at || null,
      resume_url: profile.resume_url || null,
    };
  }

  async uploadResume(file: File): Promise<UserProfile> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Not authenticated');
    }

    // Upload file to Supabase storage
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(uploadData.path);

    // Update profile in database
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        resume: uploadData.path,
        resume_name: file.name,
        resume_updated_at: new Date().toISOString(),
        resume_url: publicUrl,
      });

    if (updateError) throw updateError;

    return this.getUserProfile();
  }

  async deleteResume(): Promise<UserProfile> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Not authenticated');
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('resume')
      .eq('id', user.id)
      .single();

    if (profileData?.resume) {
      await supabase.storage.from('resumes').remove([profileData.resume]);
    }

    await supabase
      .from('profiles')
      .update({
        resume: null,
        resume_name: null,
        resume_url: null,
        resume_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return this.getUserProfile();
  }
}

export const apiService = new ApiService();

export default api;
