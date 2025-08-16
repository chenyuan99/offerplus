import { JobGPTMode, AIModel } from '../types/jobgpt';
import { 
  PromptTemplate, 
  PromptContext, 
  FormattedPrompt, 
  PROMPT_DATA,
  PromptTemplateUtils 
} from './prompts';

export enum PromptManagerErrorType {
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  INVALID_CONTEXT = 'INVALID_CONTEXT',
  VARIABLE_SUBSTITUTION_ERROR = 'VARIABLE_SUBSTITUTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class PromptManagerError extends Error {
  type: PromptManagerErrorType;
  details?: any;
  
  constructor(type: PromptManagerErrorType, message: string, details?: unknown) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'PromptManagerError';
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export class PromptManager {
  private static templateCache: Map<string, PromptTemplate> = new Map();
  private static initialized = false;

  /**
   * Initialize the PromptManager with template data
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load templates into cache
      const allTemplates = [
        ...PROMPT_DATA.templates.whyCompany,
        ...PROMPT_DATA.templates.behavioral,
        ...PROMPT_DATA.templates.general
      ];
      
      for (const template of allTemplates) {
        const validation = PromptTemplateUtils.validateTemplate(template);
        if (!validation.valid) {
          console.warn(`Invalid template ${template.id}:`, validation.errors);
          continue;
        }
        this.templateCache.set(template.id, template);
      }
      
      this.initialized = true;
      console.log(`PromptManager initialized with ${this.templateCache.size} templates`);
    } catch (error) {
      throw new PromptManagerError(
        PromptManagerErrorType.VALIDATION_ERROR,
        'Failed to initialize PromptManager',
        error
      );
    }
  }

  /**
   * Get a template by mode, optionally specifying a template ID
   */
  static getTemplate(mode: JobGPTMode, templateId?: string): PromptTemplate {
    if (!this.initialized) {
      throw new PromptManagerError(
        PromptManagerErrorType.VALIDATION_ERROR,
        'PromptManager not initialized. Call initialize() first.'
      );
    }

    if (templateId) {
      const template = this.templateCache.get(templateId);
      if (!template) {
        throw new PromptManagerError(
          PromptManagerErrorType.TEMPLATE_NOT_FOUND,
          `Template with ID '${templateId}' not found`
        );
      }
      if (template.mode !== mode) {
        throw new PromptManagerError(
          PromptManagerErrorType.VALIDATION_ERROR,
          `Template '${templateId}' is for mode '${template.mode}', not '${mode}'`
        );
      }
      return template;
    }

    // Get default template for mode
    return PromptTemplateUtils.getDefaultTemplate(mode);
  }

  /**
   * Get all templates for a specific mode
   */
  static getTemplatesByMode(mode: JobGPTMode): PromptTemplate[] {
    return PromptTemplateUtils.getTemplatesByMode(mode);
  }

  /**
   * Format a prompt with the given context
   */
  static formatPrompt(template: PromptTemplate, context: PromptContext): FormattedPrompt {
    try {
      // Validate context
      const validation = this.validateContext(context);
      if (!validation.valid) {
        throw new PromptManagerError(
          PromptManagerErrorType.INVALID_CONTEXT,
          'Invalid context provided',
          validation.errors
        );
      }

      // Prepare variables for substitution
      const variables = this.prepareVariables(template, context);
      
      // Substitute variables in user template
      const userPrompt = this.substituteVariables(template.userTemplate, variables);
      
      // Get model configuration
      const modelConfig = this.getModelConfig(template, context.model);
      
      return {
        systemPrompt: template.systemPrompt,
        userPrompt,
        modelConfig
      };
    } catch (error) {
      if (error instanceof PromptManagerError) {
        throw error;
      }
      throw new PromptManagerError(
        PromptManagerErrorType.VARIABLE_SUBSTITUTION_ERROR,
        'Failed to format prompt',
        error
      );
    }
  }

  /**
   * Validate user input for a specific mode
   */
  static validateInput(input: string, mode: JobGPTMode): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!input || input.trim().length === 0) {
      errors.push('Input cannot be empty');
    }

    if (input.length > 5000) {
      errors.push('Input is too long (maximum 5000 characters)');
    }

    // Mode-specific validation
    switch (mode) {
      case 'why_company':
        if (input.length < 3) {
          errors.push('Company name should be at least 3 characters');
        }
        if (input.length > 100) {
          warnings.push('Company name seems unusually long');
        }
        break;
        
      case 'behavioral':
        if (input.length < 10) {
          errors.push('Behavioral question should be more descriptive');
        }
        if (!input.includes('?') && !input.toLowerCase().includes('tell me') && !input.toLowerCase().includes('describe')) {
          warnings.push('This doesn\'t look like a typical behavioral interview question');
        }
        break;
        
      case 'general':
        if (input.length < 5) {
          errors.push('Please provide more details for better assistance');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get available templates for a mode with their metadata
   */
  static getTemplateOptions(mode: JobGPTMode): Array<{id: string, name: string, description: string}> {
    const templates = this.getTemplatesByMode(mode);
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description
    }));
  }

  /**
   * Extract context information from user input
   */
  static extractContext(input: string, mode: JobGPTMode): Partial<PromptContext['additionalContext']> {
    const context: Partial<PromptContext['additionalContext']> = {};

    // Simple extraction patterns - can be enhanced with NLP
    if (mode === 'why_company') {
      // For why_company mode, the input is typically just the company name
      context.companyName = input.trim();
    }

    // Extract role titles from common patterns
    const rolePatterns = [
      /(?:for|as|the)\s+(.*?)\s+(?:position|role|job)/i,
      /(?:applying|interview)\s+(?:for|as)\s+(.*?)(?:\s+at|\s+with|$)/i
    ];
    
    for (const pattern of rolePatterns) {
      const match = input.match(pattern);
      if (match) {
        context.roleTitle = match[1].trim();
        break;
      }
    }

    // Extract company names from common patterns
    const companyPatterns = [
      /(?:at|with|for)\s+([A-Z][a-zA-Z\s&.]+?)(?:\s+(?:company|corp|inc|ltd)|[.!?]|$)/,
      /(?:interview|position|role|job)\s+at\s+([A-Z][a-zA-Z\s&.]+?)(?:\s|$)/
    ];
    
    if (!context.companyName) {
      for (const pattern of companyPatterns) {
        const match = input.match(pattern);
        if (match) {
          context.companyName = match[1].trim();
          break;
        }
      }
    }

    return context;
  }

  // Private helper methods

  private static validateContext(context: PromptContext): ValidationResult {
    const errors: string[] = [];

    if (!context.userInput) {
      errors.push('User input is required');
    }

    if (!context.mode) {
      errors.push('Mode is required');
    }

    if (!context.model) {
      errors.push('Model is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static prepareVariables(template: PromptTemplate, context: PromptContext): Record<string, string> {
    const variables: Record<string, string> = {
      userInput: context.userInput || ''
    };

    // Add additional context variables
    if (context.additionalContext) {
      const { companyName, roleTitle, industry } = context.additionalContext;
      if (companyName) variables.companyName = companyName;
      if (roleTitle) variables.roleTitle = roleTitle;
      if (industry) variables.industry = industry;
    }

    // Auto-extract context if not provided
    const extractedContext = this.extractContext(context.userInput, context.mode);
    if (extractedContext.companyName && !variables.companyName) {
      variables.companyName = extractedContext.companyName;
    }
    if (extractedContext.roleTitle && !variables.roleTitle) {
      variables.roleTitle = extractedContext.roleTitle;
    }

    // Ensure all required variables have values
    for (const variable of template.variables) {
      if (!variables[variable]) {
        // Provide fallback values for common variables
        switch (variable) {
          case 'companyName':
            variables[variable] = 'the company';
            break;
          case 'roleTitle':
            variables[variable] = 'this position';
            break;
          case 'industry':
            variables[variable] = 'this industry';
            break;
          default:
            variables[variable] = `[${variable}]`;
        }
      }
    }

    return variables;
  }

  private static substituteVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    return result;
  }

  private static getModelConfig(template: PromptTemplate, model: AIModel): FormattedPrompt['modelConfig'] {
    // Start with default configuration for the model
    const defaultConfig = PROMPT_DATA.modelConfigurations[model] || {
      maxTokens: 400,
      temperature: 0.7
    };

    // Apply template-specific optimizations if available
    const templateOptimization = template.modelOptimizations?.[model];
    
    return {
      maxTokens: templateOptimization?.maxTokens || defaultConfig.maxTokens,
      temperature: templateOptimization?.temperature || defaultConfig.temperature
    };
  }

  /**
   * Clear template cache (useful for testing or hot reloading)
   */
  static clearCache(): void {
    this.templateCache.clear();
    this.initialized = false;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; initialized: boolean } {
    return {
      size: this.templateCache.size,
      initialized: this.initialized
    };
  }
}

// Initialize the PromptManager when the module is loaded
PromptManager.initialize().catch(error => {
  console.error('Failed to initialize PromptManager:', error);
});