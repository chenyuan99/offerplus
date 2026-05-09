/**
 * Applications and Storage Service
 * Handles all database operations for job applications and resume storage
 *
 * For authentication and profile management, use authService instead.
 *
 * @example
 * ```typescript
 * import { applicationsApi, storageService } from '@/services/api';
 *
 * // List applications
 * const apps = await applicationsApi.list();
 *
 * // Create application
 * const newApp = await applicationsApi.create({
 *   job_title: 'Senior Engineer',
 *   company_name: 'Google',
 *   job_link: 'https://google.com/jobs/123',
 *   company_link: 'https://google.com',
 *   status: 'applied',
 *   date_applied: new Date().toISOString(),
 * });
 *
 * // Upload resume
 * const file = new File(['resume content'], 'resume.pdf');
 * const result = await storageService.uploadResume(file);
 * console.log('Resume URL:', result.publicUrl);
 * ```
 */

import { supabase } from '../lib/supabase';
import type {
  Application,
  ApplicationInsert,
  ApplicationUpdate,
} from '../types/supabase';

// ============================================================================
// Applications Service
// ============================================================================

/**
 * Applications API
 * Type-safe methods for managing job applications
 */
export const applicationsApi = {
  /**
   * Fetch all applications for the current user
   * Ordered by date applied (newest first)
   * @returns Array of Application records
   *
   * @example
   * ```typescript
   * const apps = await applicationsApi.list();
   * console.log(`You have ${apps.length} applications`);
   * ```
   */
  list: async (): Promise<Application[]> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('date_applied', { ascending: false });

      if (error) throw error;
      return (data as Application[]) || [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  /**
   * Create a new application
   * @param data Application data (user_id is added automatically)
   * @returns Created Application with id and timestamps
   *
   * @example
   * ```typescript
   * const app = await applicationsApi.create({
   *   job_title: 'Software Engineer',
   *   company_name: 'Microsoft',
   *   job_link: 'https://microsoft.com/jobs/123',
   *   company_link: 'https://microsoft.com',
   *   status: 'applied',
   *   date_applied: new Date().toISOString(),
   *   notes: 'Referred by John',
   * });
   * console.log('Created application #', app.id);
   * ```
   */
  create: async (data: ApplicationInsert): Promise<Application> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('applications')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return result as Application;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  /**
   * Get a single application by ID
   * @param id Application ID
   * @returns Application record
   *
   * @example
   * ```typescript
   * const app = await applicationsApi.get(1);
   * console.log('Status:', app.status);
   * ```
   */
  get: async (id: number): Promise<Application> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Application;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  /**
   * Update an application
   * @param id Application ID
   * @param updates Partial application data
   * @returns Updated Application
   *
   * @example
   * ```typescript
   * const updated = await applicationsApi.update(1, {
   *   status: 'interview',
   *   notes: 'Phone screen scheduled for Friday 2pm',
   * });
   * ```
   */
  update: async (id: number, updates: ApplicationUpdate): Promise<Application> => {
    try {
      const { data: result, error } = await supabase
        .from('applications')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Application;
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  },

  /**
   * Delete an application
   * @param id Application ID
   *
   * @example
   * ```typescript
   * await applicationsApi.delete(1);
   * console.log('Application deleted');
   * ```
   */
  delete: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  },

  /**
   * Update application status
   * @param id Application ID
   * @param status New status
   * @returns Updated application
   */
  updateStatus: async (
    id: number,
    status: Application['status']
  ): Promise<Application> => {
    return applicationsApi.update(id, {
      status,
      notes: undefined,
    });
  },
};

// ============================================================================
// Storage Service (Resumes)
// ============================================================================

interface UploadResult {
  filePath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
}

/**
 * Storage Service
 * Handles resume uploads and file management
 */
export const storageService = {
  /**
   * Upload a resume file to storage
   * @param file Resume file to upload
   * @returns Upload result with file path and public URL
   *
   * @example
   * ```typescript
   * const file = new File(['resume'], 'resume.pdf');
   * const result = await storageService.uploadResume(file);
   * console.log('Resume uploaded:', result.publicUrl);
   * ```
   */
  uploadResume: async (file: File): Promise<UploadResult> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User not authenticated');

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

      return {
        filePath: uploadData.path,
        publicUrl,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  },

  /**
   * Delete a resume file from storage
   * @param filePath File path in storage (e.g., 'user-id/filename.pdf')
   *
   * @example
   * ```typescript
   * await storageService.deleteResume('uuid/resume.pdf');
   * ```
   */
  deleteResume: async (filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from('resumes')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  },

  /**
   * Get public URL for a resume file
   * @param filePath File path in storage
   * @returns Public URL
   */
  getPublicUrl: (filePath: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
    return publicUrl;
  },
};

// ============================================================================
// Legacy Support - Alias for backward compatibility
// ============================================================================

/**
 * @deprecated Use authService.uploadResume() instead
 */
export class ApiService {
  /**
   * @deprecated Use authService.getProfile() instead
   */
  async getUserProfile() {
    const { authService } = await import('./authService');
    return authService.getProfile();
  }

  /**
   * @deprecated Use storageService.uploadResume() and authService.updateProfile() instead
   */
  async uploadResume(file: File) {
    const { authService } = await import('./authService');
    const result = await storageService.uploadResume(file);

    // Update profile with resume info
    await authService.updateProfile({
      resume: result.filePath,
      resume_name: result.fileName,
      resume_url: result.publicUrl,
      resume_updated_at: new Date().toISOString(),
    });

    return authService.getProfile();
  }

  /**
   * @deprecated Use storageService.deleteResume() and authService.updateProfile() instead
   */
  async deleteResume() {
    const { authService } = await import('./authService');
    const profile = await authService.getProfile();

    if (profile?.resume) {
      await storageService.deleteResume(profile.resume);
    }

    await authService.updateProfile({
      resume: undefined,
      resume_name: undefined,
      resume_url: undefined,
      resume_updated_at: new Date().toISOString(),
    });

    return authService.getProfile();
  }
}

/**
 * @deprecated Use authService and storageService instead
 */
export const apiService = new ApiService();
