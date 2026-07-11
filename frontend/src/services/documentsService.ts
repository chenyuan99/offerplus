import { supabase } from '../lib/supabase';

export type DocumentType = 'resume' | 'cover_letter' | 'transcript' | 'certification' | 'portfolio' | 'other';

export interface UserDocument {
  id: string;
  user_id: string;
  type: DocumentType;
  name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  transcript: 'Transcript',
  certification: 'Certification',
  portfolio: 'Portfolio',
  other: 'Other',
};

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'text/plain',
];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const documentsService = {
  list: async (): Promise<UserDocument[]> => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as UserDocument[];
  },

  upload: async (file: File, type: DocumentType, name?: string): Promise<UserDocument> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Please log in to upload a document');

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a PDF, Word document, image, or text file.');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error('File size must be less than 10MB.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        type,
        name: name?.trim() || file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (error) {
      // Roll back the uploaded file if the record couldn't be saved
      await supabase.storage.from('documents').remove([filePath]);
      throw error;
    }

    return data as UserDocument;
  },

  remove: async (document: UserDocument): Promise<void> => {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);
    if (storageError) throw storageError;

    const { error } = await supabase.from('documents').delete().eq('id', document.id);
    if (error) throw error;
  },
};
