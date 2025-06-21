import { supabase } from './supabase';

interface FetchOptions extends RequestInit {
  token?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    // If no session, throw error
    if (!session) {
      throw new Error('No active session');
    }

    // Prepare headers
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    
    // Add the authorization token
    const token = session.access_token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Parse and return the response
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Example API functions
export const api = {
  // Profile related endpoints
  profile: {
    get: () => fetchWithAuth('/api/profile/'),
    update: (data: any) => fetchWithAuth('/api/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },
  
  // Resume related endpoints
  resumes: {
    list: () => fetchWithAuth('/api/resumes/'),
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      return fetch(`${API_BASE_URL}/api/resumes/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      });
    },
    delete: (resumeId: string) => fetchWithAuth(`/api/resumes/${resumeId}/`, {
      method: 'DELETE',
    }),
  },
};
