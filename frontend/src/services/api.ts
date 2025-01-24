import axios from 'axios';
import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://offerplus.io';

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
  list: () => api.get('/api/applications/'),
  create: (data: any) => api.post('/api/applications/', data),
  get: (id: number) => api.get(`/api/applications/${id}/`),
  update: (id: number, data: any) => api.put(`/api/applications/${id}/`, data),
  delete: (id: number) => api.delete(`/api/applications/${id}/`),
};

export default api;
