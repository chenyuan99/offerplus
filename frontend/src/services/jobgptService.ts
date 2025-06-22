import { supabase } from '../lib/supabase';

interface JobGPTResponse {
  response: string;
  // Add other response properties as needed
}

interface ResumeUploadResponse {
  success: boolean;
  filePath?: string;
  message?: string;
  // Add other response properties as needed
}

export const jobgptService = {
  sendPrompt: async (prompt: string, context: Record<string, unknown> = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('jobgpt-prompt', {
        body: { prompt, context }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending prompt to JobGPT:', error);
      throw error;
    }
  },

  uploadResume: async (file: File) => {
    try {
      // First upload the file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resumes/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
      
      // Call the Edge Function to process the resume
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: { filePath: publicUrl }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  },

  matchResume: async (jobDescription: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('match-resume', {
        body: { jobDescription }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error matching resume:', error);
      throw error;
    }
  },
};
