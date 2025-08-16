export interface ProfileFormData {
  first_name: string;
  last_name: string;
  title: string;
  bio: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  skills: string;
}

export interface ResumeInfo {
  id?: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  user_id: string;
}

export interface UserMetadata {
  first_name?: string;
  last_name?: string;
  username?: string;
  title?: string;
  bio?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  skills?: string[] | string;
  avatar_url?: string;
  [key: string]: any; // Allow additional properties
}

export interface ExtendedUser {
  id: string;
  email?: string;
  user_metadata: UserMetadata;
  created_at?: string;
  updated_at?: string;
}
