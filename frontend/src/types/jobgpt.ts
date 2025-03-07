export type JobGPTMode = 'why_company' | 'behavioral' | 'general';
export type DeepseekModel = 'deepseek-coder-6.7b' | 'deepseek-coder-33b' | 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';

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
  model: DeepseekModel;
  isLoading: boolean;
  error: string | null;
  input: string;
  output: string;
}
