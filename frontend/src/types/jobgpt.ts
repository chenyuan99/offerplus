export type JobGPTMode = 'why_company' | 'behavioral' | 'general';
export type AIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';

export interface JobGPTResponse {
  response: string;
  mode: JobGPTMode;
  model: AIModel;
  templateUsed: string;
  processingTime: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

export interface ResumeUploadResponse {
  feedback: string;
  message: string;
  error?: string;
}

export interface JobGPTState {
  mode: JobGPTMode;
  model: AIModel;
  isLoading: boolean;
  error: string | null;
  input: string;
  output: string;
  lastResponse?: JobGPTResponse;
}
