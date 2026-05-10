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

    const mappedModel = this.mapModelName(model);
    const isGpt5Model = mappedModel.startsWith('gpt-5');

    const requestBody: any = {
      model: mappedModel,
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userPrompt }
      ],
      stream: false
    };

    // gpt-5 models use max_completion_tokens, older models use max_tokens
    if (isGpt5Model) {
      requestBody.max_completion_tokens = prompt.modelConfig.maxTokens;
      // gpt-5-mini only supports temperature=1 (default)
    } else {
      requestBody.max_tokens = prompt.modelConfig.maxTokens;
      requestBody.temperature = prompt.modelConfig.temperature;
    }

    const debugMode = import.meta.env.NEXT_PUBLIC_DEBUG === 'true';

    try {

      if (debugMode) console.log('[DEBUG] Making OpenAI API request...', {
        model: this.mapModelName(model),
        apiKeyPrefix: this.config.apiKey?.substring(0, 20) + '...',
        hasApiKey: !!this.config.apiKey
      });

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
        const errorMessage = errorData.error?.message || response.statusText;

        console.error('OpenAI API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          fullError: errorMessage
        });

        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error(`OpenAI Authentication Error: Invalid or expired API key. Please check your NEXT_PUBLIC_OPENAI_API_KEY configuration. Details: ${errorMessage}`);
        } else if (response.status === 429) {
          throw new Error(`OpenAI Rate Limit: Too many requests. Please try again later. Details: ${errorMessage}`);
        } else if (response.status === 500) {
          throw new Error(`OpenAI Server Error: The OpenAI API is experiencing issues. Please try again. Details: ${errorMessage}`);
        } else {
          throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
        }
      }

      if (debugMode) console.log('OpenAI API request successful');

      const data = await response.json();

      if (debugMode) {
        console.log('[OpenAI Response]', {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length,
          finishReason: data.choices?.[0]?.finish_reason,
          contentLength: data.choices?.[0]?.message?.content?.length,
          content: data.choices?.[0]?.message?.content?.substring(0, 100),
          fullResponse: data
        });
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      return {
        content: data.choices[0].message.content ?? '',
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
    const debugMode = import.meta.env.NEXT_PUBLIC_DEBUG === 'true';
    const logData: any = {
      hasApiKey: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey?.length,
      apiKeyPrefix: this.config.apiKey?.substring(0, 10)
    };
    if (debugMode) {
      logData.apiKeyValue = this.config.apiKey;
    }
    console.log('Validating OpenAI config:', logData);

    if (!this.config.apiKey) {
      console.error('OpenAI API key is missing');
      return false;
    }
    if (!this.config.apiKey.startsWith('sk-')) {
      console.error('OpenAI API key has invalid format. Should start with "sk-"', {
        received: this.config.apiKey
      });
      return false;
    }
    return true;
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
      case 'gpt-5-mini':
        return 'gpt-5-mini';
      case 'gpt-3.5-turbo':
        return 'gpt-3.5-turbo';
      case 'gpt-4':
        return 'gpt-4';
      case 'gpt-4-turbo':
        return 'gpt-4-turbo';
      default:
        return 'gpt-5-mini'; // fallback
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
      const openaiKey = import.meta.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const debugMode = import.meta.env.NEXT_PUBLIC_DEBUG === 'true';
      const logData: any = {
        hasOpenaiKey: !!openaiKey,
        openaiKeyLength: openaiKey?.length,
        openaiKeyPrefix: openaiKey?.substring(0, 10)
      };
      if (debugMode) {
        logData.allEnv = import.meta.env;
      }
      console.log('AIModelManager.initialize - Environment variables:', logData);

      if (openaiKey) {
        const openaiAdapter = new OpenAIAdapter({ apiKey: openaiKey });
        this.adapters.set('openai', openaiAdapter);
      } else {
        console.warn('OpenAI API key not found. JobGPT features will not be available.');
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
      models.push('gpt-5-mini', 'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo');
    }

    return models;
  }

  static async fetchOpenAIModels(): Promise<string[]> {
    const adapter = this.getAdapter('gpt-3.5-turbo');
    if (!(adapter instanceof OpenAIAdapter)) {
      throw new Error('OpenAI adapter not available');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adapter.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();

      // Filter for chat-capable models (GPT models)
      const chatModels = data.data
        .filter((model: any) =>
          model.id.includes('gpt') &&
          !model.id.includes('embedding') &&
          !model.id.includes('vision') &&
          !model.id.includes('instruct')
        )
        .map((model: any) => model.id)
        .sort();

      return chatModels;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      throw error;
    }
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