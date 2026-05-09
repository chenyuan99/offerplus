# JobGPT Prompts Integration Design

## Overview

This design document outlines the architecture and implementation approach for integrating the comprehensive prompts.txt file with the JobGPT functionality. The solution will create a robust prompt management system that can efficiently serve contextual prompts to different AI models while maintaining high performance and extensibility.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   JobGPT UI     │───▶│  JobGPT Service  │───▶│  Prompt Manager │
│   Component     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   AI Model APIs  │    │ Prompt Templates│
                       │ (OpenAI/DeepSeek)│    │   (JSON/TS)     │
                       └──────────────────┘    └─────────────────┘
```

### Component Breakdown

1. **JobGPT UI Component**: Existing React component that handles user interactions
2. **JobGPT Service**: Enhanced service layer with proper generatePrompt implementation
3. **Prompt Manager**: New utility class for managing and formatting prompts
4. **AI Model APIs**: External API integrations for OpenAI and DeepSeek
5. **Prompt Templates**: Structured prompt data converted from prompts.txt

## Components and Interfaces

### 1. Prompt Manager Interface

```typescript
interface PromptTemplate {
  id: string;
  mode: JobGPTMode;
  systemPrompt: string;
  userTemplate: string;
  variables: string[];
  modelOptimizations?: {
    [key in DeepseekModel]?: {
      maxTokens?: number;
      temperature?: number;
      additionalInstructions?: string;
    };
  };
}

interface PromptContext {
  userInput: string;
  mode: JobGPTMode;
  model: DeepseekModel;
  additionalContext?: {
    companyName?: string;
    roleTitle?: string;
    industry?: string;
    userProfile?: any;
  };
}

interface FormattedPrompt {
  systemPrompt: string;
  userPrompt: string;
  modelConfig: {
    maxTokens: number;
    temperature: number;
  };
}

class PromptManager {
  static loadTemplates(): Promise<PromptTemplate[]>;
  static getTemplate(mode: JobGPTMode, templateId?: string): PromptTemplate;
  static formatPrompt(template: PromptTemplate, context: PromptContext): FormattedPrompt;
  static validateInput(input: string, mode: JobGPTMode): ValidationResult;
}
```

### 2. Enhanced JobGPT Service

```typescript
interface JobGPTService {
  generatePrompt(input: string, mode: JobGPTMode, model: DeepseekModel, context?: any): Promise<JobGPTResponse>;
  sendPrompt(prompt: string, context?: Record<string, unknown>): Promise<any>;
  uploadResume(file: File): Promise<ResumeUploadResponse>;
  matchResume(jobDescription: string): Promise<any>;
}

interface JobGPTResponse {
  response: string;
  mode: JobGPTMode;
  model: DeepseekModel;
  templateUsed: string;
  processingTime: number;
  error?: string;
}
```

### 3. AI Model Adapters

```typescript
interface AIModelAdapter {
  name: string;
  makeRequest(prompt: FormattedPrompt): Promise<string>;
  validateConfig(config: any): boolean;
  getDefaultConfig(): any;
}

class OpenAIAdapter implements AIModelAdapter {
  // OpenAI-specific implementation
}

class DeepSeekAdapter implements AIModelAdapter {
  // DeepSeek-specific implementation
}
```

## Data Models

### Prompt Template Structure

```typescript
interface PromptTemplateData {
  version: string;
  systemPrompts: {
    base: string;
    whyCompany: string;
    behavioral: string;
    general: string;
  };
  templates: {
    whyCompany: PromptTemplate[];
    behavioral: PromptTemplate[];
    general: PromptTemplate[];
    resume: PromptTemplate[];
    networking: PromptTemplate[];
  };
  modelConfigurations: {
    [key in DeepseekModel]: {
      maxTokens: number;
      temperature: number;
      topP?: number;
      frequencyPenalty?: number;
    };
  };
}
```

### Context Data Structure

```typescript
interface JobGPTContext {
  user: {
    profile?: UserProfile;
    resume?: ResumeData;
    preferences?: UserPreferences;
  };
  session: {
    previousQueries?: string[];
    currentMode: JobGPTMode;
    selectedModel: DeepseekModel;
  };
  target: {
    companyName?: string;
    roleTitle?: string;
    industry?: string;
    jobDescription?: string;
  };
}
```

## Error Handling

### Error Types and Handling Strategy

```typescript
enum JobGPTErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR'
}

class JobGPTError extends Error {
  type: JobGPTErrorType;
  details?: any;
  retryable: boolean;
  
  constructor(type: JobGPTErrorType, message: string, details?: any, retryable = false) {
    super(message);
    this.type = type;
    this.details = details;
    this.retryable = retryable;
  }
}
```

### Error Recovery Strategies

1. **API Failures**: Implement exponential backoff with jitter
2. **Rate Limiting**: Queue requests and implement user-friendly waiting
3. **Network Issues**: Provide offline mode with cached responses
4. **Invalid Input**: Show validation errors with suggestions
5. **Template Errors**: Fall back to basic templates

## Testing Strategy

### Unit Testing

1. **Prompt Manager Tests**
   - Template loading and parsing
   - Prompt formatting with various inputs
   - Variable substitution
   - Error handling for malformed templates

2. **Service Layer Tests**
   - generatePrompt method functionality
   - API integration mocking
   - Error handling and recovery
   - Response formatting

3. **AI Model Adapter Tests**
   - Request formatting for each model
   - Response parsing and validation
   - Error handling for API failures
   - Configuration validation

### Integration Testing

1. **End-to-End Prompt Flow**
   - User input → Template selection → API call → Response formatting
   - Different modes and models
   - Context integration
   - Error scenarios

2. **API Integration Tests**
   - Real API calls with test data
   - Rate limiting behavior
   - Authentication handling
   - Response validation

### Performance Testing

1. **Load Testing**
   - Concurrent user requests
   - Template caching efficiency
   - Memory usage under load
   - Response time benchmarks

2. **Stress Testing**
   - High-frequency requests
   - Large input handling
   - Memory leak detection
   - Error recovery under stress

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create PromptManager class with template loading
2. Convert prompts.txt to structured JSON/TypeScript format
3. Implement basic template formatting and variable substitution
4. Add unit tests for core functionality

### Phase 2: Service Integration
1. Implement generatePrompt method in jobgptService
2. Create AI model adapters for OpenAI and DeepSeek
3. Add error handling and retry logic
4. Integrate with existing JobGPT component

### Phase 3: Advanced Features
1. Add context-aware prompt enhancement
2. Implement caching for improved performance
3. Add prompt template validation and hot-reloading
4. Create admin interface for prompt management

### Phase 4: Testing and Optimization
1. Comprehensive testing suite
2. Performance optimization
3. Error handling refinement
4. Documentation and deployment

## Security Considerations

### API Key Management
- Store API keys securely in environment variables
- Implement key rotation capabilities
- Add request signing for sensitive operations
- Monitor API usage and detect anomalies

### Input Validation
- Sanitize user inputs to prevent injection attacks
- Validate prompt templates to prevent malicious code execution
- Implement rate limiting per user/session
- Add content filtering for inappropriate requests

### Data Privacy
- Don't log sensitive user information
- Implement data retention policies
- Add user consent mechanisms
- Ensure GDPR compliance for EU users

## Performance Optimizations

### Caching Strategy
1. **Template Caching**: Cache parsed templates in memory
2. **Response Caching**: Cache common responses with TTL
3. **Context Caching**: Cache user context between requests
4. **API Response Caching**: Cache API responses for identical prompts

### Resource Management
1. **Connection Pooling**: Reuse HTTP connections for API calls
2. **Request Batching**: Batch multiple requests when possible
3. **Lazy Loading**: Load templates only when needed
4. **Memory Management**: Implement proper cleanup and garbage collection

## Monitoring and Observability

### Metrics to Track
1. **Performance Metrics**
   - Response times by mode and model
   - API call success/failure rates
   - Template loading times
   - Cache hit/miss ratios

2. **Usage Metrics**
   - Most popular modes and models
   - User engagement patterns
   - Error frequency by type
   - Feature adoption rates

3. **Business Metrics**
   - User satisfaction scores
   - Conversion rates
   - Feature usage correlation
   - Cost per API call

### Logging Strategy
1. **Structured Logging**: Use JSON format for easy parsing
2. **Log Levels**: Implement appropriate log levels (DEBUG, INFO, WARN, ERROR)
3. **Correlation IDs**: Track requests across system boundaries
4. **Performance Logging**: Log timing information for optimization

## Deployment Considerations

### Environment Configuration
- Separate configurations for development, staging, and production
- Feature flags for gradual rollout
- A/B testing capabilities for prompt optimization
- Blue-green deployment for zero-downtime updates

### Scalability Planning
- Horizontal scaling for increased load
- Database optimization for prompt storage
- CDN integration for static assets
- Load balancing for API requests

This design provides a comprehensive foundation for integrating the prompts.txt file with JobGPT while ensuring scalability, maintainability, and excellent user experience.