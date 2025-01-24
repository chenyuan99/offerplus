import { ApplicationRecord } from '../types';
import { applicationsApi } from '../services/api';

export async function getApplications(): Promise<ApplicationRecord[]> {
  try {
    const response = await applicationsApi.getAll();
    return response.data;
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

export async function createApplication(data: Omit<ApplicationRecord, 'id' | 'created' | 'updated' | 'applicant'>): Promise<ApplicationRecord | null> {
  try {
    const response = await applicationsApi.create(data);
    return response.data;
  } catch (error) {
    console.error('Error creating application:', error);
    return null;
  }
}

export async function updateApplication(id: number, data: Partial<ApplicationRecord>): Promise<ApplicationRecord | null> {
  try {
    const response = await applicationsApi.update(id, data);
    return response.data;
  } catch (error) {
    console.error('Error updating application:', error);
    return null;
  }
}

export async function deleteApplication(id: number): Promise<boolean> {
  try {
    await applicationsApi.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting application:', error);
    return false;
  }
}