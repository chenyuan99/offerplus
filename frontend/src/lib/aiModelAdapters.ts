import { AIModel } from '../types/jobgpt';
import { FormattedPrompt } from './prompts';

export interface AIModelResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface AIModelConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export abstract class AIModelAdapter {
  protected config: AIModelConfig;
  
  constructor(config: AIModelConfig) {
    this.config = config;
  }
  
  abstract get name(): string;
  abstract makeRequest(prompt: FormattedPrompt, model: AIModel): Promise<AIModelResponse>;
  abstract validateConfig(): boolean;
  abstract getDefaultConfig(): Partial<AIModelConfig>;
}

export class OpenAIAdapter extends AIModelAdapter {
  get name(): string {
    return 'OpenAI';
  }

  async makeRequest(prompt: FormattedPrompt, model: AIModel): Promise<AIModelResponse> {
    if (!this.validateConfig()) {
      throw new Error('Invalid OpenAI configuration');
    }

    const requestBody = {
      model: this.mapModelName(model),
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt }
      ],
      max_tokens: prompt.modelConfig.maxTokens,
      temperature: prompt.modelConfig.temperature,
      stream: false
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined,
        finishReason: data.choices[0].finish_reason
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`OpenAI API request failed: ${error}`);
    }
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.startsWith('sk-'));
  }

  getDefaultConfig(): Partial<AIModelConfig> {
    return {
      baseUrl: 'https://api.openai.com/v1',
      timeout: 30000,
      maxRetries: 3
    };
  }

  private mapModelName(model: AIModel): string {
    // Map our internal model names to OpenAI API model names
    switch (model) {
      case 'gpt-3.5-turbo':
        return 'gpt-3.5-turbo';
      case 'gpt-4':
        return 'gpt-4';
      case 'gpt-4-turbo':
        return 'gpt-4-turbo-preview';
      default:
        return 'gpt-3.5-turbo'; // fallback
    }
  }
}



export enum AIModelErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export class AIModelError extends Error {
  type: AIModelErrorType;
  statusCode?: number;
  retryable: boolean;
  details?: any;
  
  constructor(
    type: AIModelErrorType, 
    message: string, 
    statusCode?: number, 
    retryable = false, 
    details?: any
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
    this.name = 'AIModelError';
  }
}

export class AIModelManager {
  private static adapters: Map<string, AIModelAdapter> = new Map();
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize OpenAI adapter if API key is available
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const openaiAdapter = new OpenAIAdapter({ apiKey: openaiKey });
        this.adapters.set('openai', openaiAdapter);
      }



      this.initialized = true;
      console.log(`AIModelManager initialized with ${this.adapters.size} adapters`);
    } catch (error) {
      throw new AIModelError(
        AIModelErrorType.VALIDATION_ERROR,
        'Failed to initialize AIModelManager',
        undefined,
        false,
        error
      );
    }
  }

  static getAdapter(model: AIModel): AIModelAdapter {
    if (!this.initialized) {
      throw new AIModelError(
        AIModelErrorType.VALIDATION_ERROR,
        'AIModelManager not initialized. Call initialize() first.'
      );
    }

    const adapter = this.adapters.get('openai');
    if (!adapter) {
      throw new AIModelError(
        AIModelErrorType.AUTHENTICATION_ERROR,
        'OpenAI adapter not available. Please check your API key configuration.'
      );
    }
    return adapter;
  }

  static async makeRequest(prompt: FormattedPrompt, model: AIModel): Promise<AIModelResponse> {
    const adapter = this.getAdapter(model);
    
    try {
      return await this.withRetry(
        () => adapter.makeRequest(prompt, model),
        3, // max retries
        1000 // initial delay
      );
    } catch (error) {
      // Convert generic errors to AIModelError
      if (error instanceof AIModelError) {
        throw error;
      }
      
      // Classify error type based on error message
      let errorType = AIModelErrorType.API_ERROR;
      let retryable = false;
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('unauthorized') || message.includes('invalid api key')) {
          errorType = AIModelErrorType.AUTHENTICATION_ERROR;
        } else if (message.includes('rate limit') || message.includes('too many requests')) {
          errorType = AIModelErrorType.RATE_LIMIT_ERROR;
          retryable = true;
        } else if (message.includes('network') || message.includes('fetch')) {
          errorType = AIModelErrorType.NETWORK_ERROR;
          retryable = true;
        } else if (message.includes('timeout')) {
          errorType = AIModelErrorType.TIMEOUT_ERROR;
          retryable = true;
        }
      }
      
      throw new AIModelError(
        errorType,
        error instanceof Error ? error.message : 'Unknown error occurred',
        undefined,
        retryable,
        error
      );
    }
  }

  static getAvailableModels(): AIModel[] {
    const models: AIModel[] = [];
    
    if (this.adapters.has('openai')) {
      models.push('gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo');
    }
    
    return models;
  }

  private static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    initialDelay: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on the last attempt or for non-retryable errors
        if (attempt === maxRetries || (error instanceof AIModelError && !error.retryable)) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  static clearAdapters(): void {
    this.adapters.clear();
    this.initialized = false;
  }

  static getStats(): { adapters: string[]; initialized: boolean } {
    return {
      adapters: Array.from(this.adapters.keys()),
      initialized: this.initialized
    };
  }
}

// Initialize the AIModelManager when the module is loaded
AIModelManager.initialize().catch(error => {
  console.error('Failed to initialize AIModelManager:', error);
});