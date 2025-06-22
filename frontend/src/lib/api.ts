import { supabase } from './supabase';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw error;
};

// All API calls are now handled directly through Supabase client
export const api = {
  // Profile related endpoints
  profile: {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) handleSupabaseError(error);
      return data;
    },
    
    update: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      return data;
    },
  },
  
  // Resume related endpoints
  resumes: {
    list: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) handleSupabaseError(error);
      return data;
    },
    
    upload: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);
      
      if (uploadError) handleSupabaseError(uploadError);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
      
      // Save resume metadata to database
      const { data: resumeData, error: dbError } = await supabase
        .from('resumes')
        .insert([
          { 
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_url: publicUrl,
            file_size: file.size,
            file_type: file.type
          }
        ])
        .select()
        .single();
      
      if (dbError) handleSupabaseError(dbError);
      return resumeData;
    },
    
    delete: async (resumeId: string) => {
      // First get the file path
      const { data: resume, error: fetchError } = await supabase
        .from('resumes')
        .select('file_path')
        .eq('id', resumeId)
        .single();
      
      if (fetchError) handleSupabaseError(fetchError);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);
      
      if (storageError) handleSupabaseError(storageError);
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);
      
      if (dbError) handleSupabaseError(dbError);
      return { success: true };
    },
  },
} as const;
