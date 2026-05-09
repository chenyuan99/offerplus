import { supabase } from '../lib/supabase';
import type {
  Application,
  ApplicationInsert,
  ApplicationUpdate,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  Resume,
  ResumeInsert,
} from '../types/supabase';

/**
 * Applications Service
 * Type-safe methods for managing job applications in Supabase
 */
export const applicationsApi = {
  /**
   * Fetch all applications for the current user
   * Ordered by date applied (newest first)
   * @returns Array of Application records
   */
  list: async (): Promise<Application[]> => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('date_applied', { ascending: false });
    if (error) throw error;
    return (data as Application[]) || [];
  },

  /**
   * Create a new application
   * @param data Application data (user_id is added automatically)
   * @returns Created Application with id and timestamps
   */
  create: async (data: ApplicationInsert): Promise<Application> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from('applications')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return result as Application;
  },

  /**
   * Get a single application by ID
   * @param id Application ID
   * @returns Application record
   */
  get: async (id: number): Promise<Application> => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Application;
  },

  /**
   * Update an application
   * @param id Application ID
   * @param updates Partial application data
   * @returns Updated Application
   */
  update: async (id: number, updates: ApplicationUpdate): Promise<Application> => {
    const { data: result, error } = await supabase
      .from('applications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result as Application;
  },

  /**
   * Delete an application
   * @param id Application ID
   */
  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

/**
 * User Profile Service
 * Type-safe methods for managing user profiles
 */
class ApiService {
  /**
   * Get the current user's profile
   * @returns UserProfile with resume information
   */
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
    let profile = profileData as any;
    if (profileError && (profileError.code === 'PGRST116' || profileError.code === 'PGRST205')) {
      // Profile doesn't exist or table not in schema cache, use defaults
      profile = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
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
      email: profile.email || user.email || '',
      username: profile.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user',
      resume: profile.resume || null,
      resume_name: profile.resume_name || null,
      resume_updated_at: profile.resume_updated_at || null,
      resume_url: profile.resume_url || null,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
    } as UserProfile;
  }

  /**
   * Upload a resume file to storage and update user profile
   * @param file Resume file to upload
   * @returns Updated UserProfile
   */
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
        updated_at: new Date().toISOString(),
      });

    if (updateError) throw updateError;

    return await this.getUserProfile();
  }

  /**
   * Delete user's resume from storage and profile
   * @returns Updated UserProfile with resume fields cleared
   */
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
      await supabase.storage.from('resumes').remove([profileData.resume as string]);
    }

    await supabase
      .from('profiles')
      .update({
        resume: null,
        resume_name: null,
        resume_url: null,
        resume_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return this.getUserProfile();
  }
}

export const apiService = new ApiService();
