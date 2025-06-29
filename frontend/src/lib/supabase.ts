import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export auth types for better TypeScript support
export type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

export const uploadResume = async (file: File) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Please login to upload a resume');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a PDF or Word document.');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB.');
    }

    // Create a unique file name
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt) {
      throw new Error('Invalid file extension.');
    }

    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    // Include user ID in the path for proper access control
    const filePath = `${user.id}/${fileName}`;

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type // Explicitly set content type
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      if (uploadError.message.includes('duplicate')) {
        throw new Error('A file with this name already exists');
      }
      throw new Error(uploadError.message);
    }

    if (!data?.path) {
      throw new Error('Upload failed: No file path returned');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(data.path);

    return { 
      publicUrl,
      filePath: data.path,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Resume upload failed: ${error.message}`);
    }
    throw new Error('Resume upload failed: Unknown error');
  }
};
