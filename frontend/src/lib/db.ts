import { ApplicationRecord } from '../types';
import { applicationsApi } from '../services/api';

export const jobsDb = {
  async init() {
    // No initialization needed for API
    return true;
  },

  async list(): Promise<ApplicationRecord[]> {
    try {
      const response = await applicationsApi.list();
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  },

  async add(application: Omit<ApplicationRecord, 'id' | 'created' | 'updated' | 'applicant'>): Promise<number> {
    try {
      const response = await applicationsApi.create(application);
      return response.data.id;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  async update(application: Partial<ApplicationRecord> & { id: number }): Promise<boolean> {
    try {
      await applicationsApi.update(application.id, application);
      return true;
    } catch (error) {
      console.error('Error updating application:', error);
      return false;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      await applicationsApi.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  }
};