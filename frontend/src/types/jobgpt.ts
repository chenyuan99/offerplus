export type JobGPTMode = 'cover-letter' | 'resume' | 'recommendation';

export interface JobGPTResponse {
  prompt: string;
  error?: string;
}

export interface ResumeUploadResponse {
  file_url?: string;
  error?: string;
}

export interface JobGPTState {
  mode: JobGPTMode;
  isLoading: boolean;
  error: string | null;
  input: string;
  output: string;
}
