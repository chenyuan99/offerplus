// Profile JSON import format (from job boards like Workday)
export interface ImportedProfileEducation {
  currentlyAttending: boolean;
  degree: string;
  endDate: string;
  fieldOfStudy: string;
  gpa: string;
  school: string;
  startDate: string;
}

export interface ImportedProfileJob {
  company: string;
  currentlyWorkHere: boolean;
  description: string;
  jobTitle: string;
  location: string;
  startDate: string;
  endDate?: string;
}

export interface ImportedProfile {
  addressData: {
    city: string;
    country: string;
    line1: string;
    postalCode: string;
    state: string;
  };
  contactData: {
    email: string;
    phoneCountryCode: string;
    phoneDeviceType: string;
    phoneNumber: string;
  };
  educationData: ImportedProfileEducation[];
  employmentData: {
    ethnicity: string;
    gender: string;
  };
  jobData: ImportedProfileJob[];
  languageData: string[];
  nameData: {
    firstName: string;
    lastName: string;
    preferredName: boolean;
  };
  resumeData: {
    dateUploaded: string;
    fileName: string;
    fileSize: number;
    resumeBase64: string;
  };
}

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
