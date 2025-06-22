import { supabase } from '../lib/supabase';

export const gmailService = {
  syncGmail: async (): Promise<{ message: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-gmail');
      if (error) throw error;
      return data;
    } catch (error: unknown) {
      console.error('Error syncing Gmail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync Gmail';
      throw new Error(errorMessage);
    }
  },
};
