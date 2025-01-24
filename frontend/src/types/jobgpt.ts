export type JobGPTMode = 'why_company' | 'behavioral' | 'general';

export interface JobGPTResponse {
  response: string;
  mode: JobGPTMode;
  error?: string;
}

export interface ResumeUploadResponse {
  feedback: string;
  message: string;
  error?: string;
}

export interface JobGPTState {
  mode: JobGPTMode;
  isLoading: boolean;
  error: string | null;
  input: string;
  output: string;
}
