import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await axios.post(`${API_URL}/api/auth/login/`, credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<void> {
    await axios.post(`${API_URL}/api/auth/register/`, credentials);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const response = await axios.get(`${API_URL}/api/auth/user/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.warn('No refresh token found in localStorage');
      return null;
    }

    try {
      console.log('Attempting to refresh token...');
      const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
        refresh: refreshToken,
      });
      const newAccessToken = response.data.access;
      localStorage.setItem('access_token', newAccessToken);
      console.log('Token refresh successful');
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return null;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();

// Axios interceptor for automatic token refresh
axios.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Intercepted 401 error, attempting token refresh...');

      try {
        const newToken = await authService.refreshToken();
        if (newToken) {
          console.log('Token refresh successful, retrying original request');
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } else {
          console.warn('Token refresh returned null, rejecting request');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Token refresh failed in interceptor:', refreshError);
        authService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
