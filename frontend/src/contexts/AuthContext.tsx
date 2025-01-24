import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { authService } from '../services/auth';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: { username: string; email: string; password: string; password2: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const response = await authApi.getUser();
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      await authService.login({ username, password });
      await checkAuth();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: { username: string; email: string; password: string; password2: string }) => {
    try {
      setError(null);
      await authApi.register(userData);
      await login(userData.username, userData.password);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
