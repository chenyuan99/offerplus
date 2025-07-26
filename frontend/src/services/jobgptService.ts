import { supabase } from '../lib/supabase';
import { JobGPTMode, DeepseekModel, JobGPTResponse } from '../types/jobgpt';
import { PromptManager, PromptManagerError } from '../lib/promptManager';
import { AIModelManager, AIModelError } from '../lib/aiModelAdapters';

interface ResumeUploadResponse {
  success: boolean;
  filePath?: string;
  message?: string;
  // Add other response properties as needed
}

export const jobgptService = {
  generatePrompt: async (
    input: string, 
    mode: JobGPTMode, 
    model: DeepseekModel,
    additionalContext?: any
  ): Promise<JobGPTResponse> => {
    const startTime = Date.now();
    
    try {
      // Validate input
      const validation = PromptManager.validateInput(input, mode);
      if (!validation.valid) {
        throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
      }

      // Get appropriate template
      const template = PromptManager.getTemplate(mode);
      
      // Extract context from input
      const extractedContext = PromptManager.extractContext(input, mode);
      
      // Prepare context
      const context = {
        userInput: input,
        mode,
        model,
        additionalContext: {
          ...extractedContext,
          ...additionalContext
        }
      };

      // Format prompt
      const formattedPrompt = PromptManager.formatPrompt(template, context);
      
      // Make API request
      const response = await AIModelManager.makeRequest(formattedPrompt, model);
      
      const processingTime = Date.now() - startTime;
      
      return {
        response: response.content,
        mode,
        model,
        templateUsed: template.id,
        processingTime,
        usage: response.usage
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Handle specific error types
      if (error instanceof PromptManagerError) {
        throw new Error(`Prompt error: ${error.message}`);
      }
      
      if (error instanceof AIModelError) {
        let userMessage = 'AI service error';
        
        switch (error.type) {
          case 'AUTHENTICATION_ERROR':
            userMessage = 'Authentication failed. Please check your API key configuration.';
            break;
          case 'RATE_LIMIT_ERROR':
            userMessage = 'Rate limit exceeded. Please try again in a moment.';
            break;
          case 'NETWORK_ERROR':
            userMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'TIMEOUT_ERROR':
            userMessage = 'Request timed out. Please try again.';
            break;
          default:
            userMessage = error.message;
        }
        
        throw new Error(userMessage);
      }
      
      // Generic error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('JobGPT generatePrompt error:', error);
      
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  },

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
