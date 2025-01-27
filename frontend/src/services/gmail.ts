import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const syncGmail = async (): Promise<{ message: string }> => {
  try {
    const response = await axios.post(`${API_URL}/api/sync-gmail/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to sync Gmail');
  }
};
