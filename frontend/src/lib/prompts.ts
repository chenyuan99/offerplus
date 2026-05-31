import { JobGPTMode, AIModel } from '../types/jobgpt';

export interface PromptTemplate {
  id: string;
  mode: JobGPTMode;
  name: string;
  description: string;
  systemPrompt: string;
  userTemplate: string;
  variables: string[];
  modelOptimizations?: {
    [key in AIModel]?: {
      maxTokens?: number;
      temperature?: number;
      additionalInstructions?: string;
    };
  };
}

export interface PromptContext {
  userInput: string;
  mode: JobGPTMode;
  model: AIModel;
  additionalContext?: {
    companyName?: string;
    roleTitle?: string;
    industry?: string;
    userProfile?: any;
  };
}

export interface FormattedPrompt {
  systemPrompt: string;
  userPrompt: string;
  modelConfig: {
    maxTokens: number;
    temperature: number;
  };
}

export interface PromptTemplateData {
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
  };
  modelConfigurations: {
    [key in AIModel]: {
      maxTokens: number;
      temperature: number;
      topP?: number;
      frequencyPenalty?: number;
    };
  };
}

// Structured prompt data converted from prompts.txt
export const PROMPT_DATA: PromptTemplateData = {
  version: "1.0",
  systemPrompts: {
    base: "You are JobGPT, an AI assistant specialized in helping job seekers with their career development. You provide professional, actionable advice for job applications, interviews, and career growth. Always maintain a helpful, encouraging, and professional tone.",
    
    whyCompany: "You are JobGPT, a career advisor specializing in helping candidates articulate their interest in specific companies. Your role is to help users craft compelling \"Why do you want to work at this company?\" responses that demonstrate genuine interest, research, and alignment with company values. Focus on specific, authentic reasons rather than generic statements.",
    
    behavioral: "You are JobGPT, an expert in behavioral interview preparation. You help candidates structure their responses using the STAR method (Situation, Task, Action, Result) and provide coaching on how to effectively communicate their experiences. Focus on helping users tell compelling stories that demonstrate their skills and achievements.",
    
    general: "You are JobGPT, a comprehensive career advisor. You assist with various career-related tasks including resume optimization, cover letter writing, interview preparation, salary negotiation, and career planning. Provide specific, actionable advice tailored to the user's situation and career goals."
  },
  
  templates: {
    whyCompany: [
      {
        id: "company-research-interest",
        mode: "why_company",
        name: "Company Research and Interest",
        description: "Help craft compelling responses based on company research",
        systemPrompt: "You are JobGPT, an expert career advisor specializing in crafting compelling 'Why do you want to work here?' responses. Create authentic, well-researched answers that demonstrate genuine interest and alignment. Structure responses with: (1) Personal discovery story, (2) 2-3 specific researched facts about the company, (3) Three key reasons - career growth, values alignment, and product/impact excitement, (4) How their skills contribute, (5) Authentic closing with genuine enthusiasm. Be specific not generic, authentic not scripted, and show real research about the company.",
        userTemplate: "Company: {companyName}. About me: {userInput}. Help me craft a 'Why do you want to work here?' response that opens with my discovery story, includes specific facts about {companyName}, presents 3 clear reasons (career growth, values alignment, product excitement), explains my contribution, and closes with authentic enthusiasm. Keep it 280-320 words, specific and authentic.",
        variables: ["companyName", "userInput"],
        modelOptimizations: {
          "gpt-5-mini": { maxTokens: 2000, temperature: 1 },
          "gpt-4": { maxTokens: 600, temperature: 0.8 },
          "gpt-4-turbo": { maxTokens: 650, temperature: 0.8 },
          "gpt-3.5-turbo": { maxTokens: 500, temperature: 0.85 }
        }
      },
      {
        id: "values-alignment",
        mode: "why_company",
        name: "Company Values Alignment",
        description: "Focus on company culture and values alignment",
        systemPrompt: "You are JobGPT, an expert at helping candidates articulate authentic alignment between personal values and company mission. Create responses that demonstrate deep cultural fit by identifying shared values, showing understanding of company culture with specific examples, demonstrating knowledge of company initiatives, connecting personal growth to company opportunities, and showing genuine enthusiasm. Be authentic, specific, and avoid generic corporate jargon.",
        userTemplate: "Help me create a compelling response about why I want to work at {companyName}, focusing on values alignment. Company: {companyName}. About me: {userInput}. Create a response that: 1) Demonstrates my understanding of {companyName}'s core values and mission. 2) Explains how my personal values align with {companyName}'s culture. 3) Highlights specific company initiatives or products that inspire me. 4) Shows how {companyName} fits my career growth and learning goals. 5) Conveys genuine passion for {companyName}'s work and impact. 6) Explains why I'd be a great cultural fit. Make it authentic, specific - 250-300 words.",
        variables: ["companyName", "userInput"],
        modelOptimizations: {
          "gpt-5-mini": { maxTokens: 600, temperature: 0.75 },
          "gpt-4": { maxTokens: 500, temperature: 0.8 },
          "gpt-4-turbo": { maxTokens: 550, temperature: 0.8 },
          "gpt-3.5-turbo": { maxTokens: 450, temperature: 0.85 }
        }
      }
    ],
    
    behavioral: [
      {
        id: "star-method-coaching",
        mode: "behavioral",
        name: "STAR Method Coaching",
        description: "Guide users through STAR method for behavioral questions",
        systemPrompt: "You are JobGPT, an expert in behavioral interview preparation. You help candidates structure their responses using the STAR method (Situation, Task, Action, Result) and provide coaching on how to effectively communicate their experiences. Focus on helping users tell compelling stories that demonstrate their skills and achievements.",
        userTemplate: `Help me structure a response to the behavioral question: "{userInput}"

Please guide me through the STAR method:
- Situation: What was the context or background?
- Task: What was your responsibility or what needed to be accomplished?
- Action: What specific steps did you take?
- Result: What was the outcome and what did you learn?

Provide tips on making the story compelling and relevant to the skills the interviewer is assessing.`,
        variables: ["userInput"]
      },
      {
        id: "behavioral-question-analysis",
        mode: "behavioral",
        name: "Behavioral Question Analysis",
        description: "Analyze what interviewers are looking for in behavioral questions",
        systemPrompt: "You are JobGPT, an expert in behavioral interview preparation. You help candidates structure their responses using the STAR method (Situation, Task, Action, Result) and provide coaching on how to effectively communicate their experiences. Focus on helping users tell compelling stories that demonstrate their skills and achievements.",
        userTemplate: `I need help preparing for this behavioral interview question: "{userInput}"

Please provide:
1. What the interviewer is really looking for with this question
2. A framework for structuring my response
3. Key points to emphasize
4. Common mistakes to avoid
5. Example phrases or transitions I can use`,
        variables: ["userInput"]
      }
    ],
    
    general: [
      {
        id: "resume-optimization",
        mode: "general",
        name: "Resume Optimization",
        description: "Provide comprehensive resume feedback and optimization",
        systemPrompt: "You are JobGPT, a comprehensive career advisor. You assist with various career-related tasks including resume optimization, cover letter writing, interview preparation, salary negotiation, and career planning. Provide specific, actionable advice tailored to the user's situation and career goals.",
        userTemplate: `Please review and provide feedback on my resume content:

{userInput}

Focus on:
1. Overall structure and formatting
2. Impact and achievement-focused language
3. Relevance to my target role/industry
4. ATS (Applicant Tracking System) optimization
5. Areas for improvement or expansion

Provide specific, actionable suggestions for enhancement.`,
        variables: ["userInput"]
      },
      {
        id: "cover-letter-writing",
        mode: "general",
        name: "Cover Letter Writing",
        description: "Help write compelling cover letters",
        systemPrompt: "You are JobGPT, a comprehensive career advisor. You assist with various career-related tasks including resume optimization, cover letter writing, interview preparation, salary negotiation, and career planning. Provide specific, actionable advice tailored to the user's situation and career goals.",
        userTemplate: `Help me write a compelling cover letter for the {roleTitle} position at {companyName}.

User input: {userInput}

Please structure it to include:
- Strong opening that captures attention
- Specific examples of relevant experience
- Connection between my skills and job requirements
- Demonstration of company knowledge and interest
- Professional closing with clear next steps

Keep it concise, engaging, and tailored to the specific role.`,
        variables: ["roleTitle", "companyName", "userInput"]
      },
      {
        id: "interview-preparation",
        mode: "general",
        name: "Interview Preparation",
        description: "Comprehensive interview preparation guidance",
        systemPrompt: "You are JobGPT, a comprehensive career advisor. You assist with various career-related tasks including resume optimization, cover letter writing, interview preparation, salary negotiation, and career planning. Provide specific, actionable advice tailored to the user's situation and career goals.",
        userTemplate: `I have an interview for {roleTitle} at {companyName}. Help me prepare.

User input: {userInput}

Please provide:
1. Common questions for this type of role
2. Company-specific questions I should research
3. Questions I should ask the interviewer
4. Key points about my background to emphasize
5. Tips for making a strong impression`,
        variables: ["roleTitle", "companyName", "userInput"]
      }
    ]
  },
  
  modelConfigurations: {
    "gpt-5-mini": {
      maxTokens: 800,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.1
    },
    "gpt-4": {
      maxTokens: 500,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.1
    },
    "gpt-4-turbo": {
      maxTokens: 600,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.1
    },
    "gpt-3.5-turbo": {
      maxTokens: 400,
      temperature: 0.8,
      topP: 0.9,
      frequencyPenalty: 0.2
    }
  }
};

// Utility functions for template management
export class PromptTemplateUtils {
  // Maps snake_case JobGPTMode values to the camelCase keys in PROMPT_DATA.templates
  private static readonly MODE_KEY_MAP: Record<JobGPTMode, keyof typeof PROMPT_DATA.templates> = {
    why_company: 'whyCompany',
    behavioral: 'behavioral',
    general: 'general',
  };

  static getTemplatesByMode(mode: JobGPTMode): PromptTemplate[] {
    const key = PromptTemplateUtils.MODE_KEY_MAP[mode];
    return PROMPT_DATA.templates[key] || [];
  }
  
  static getDefaultTemplate(mode: JobGPTMode): PromptTemplate {
    const templates = this.getTemplatesByMode(mode);
    return templates[0] || this.createFallbackTemplate(mode);
  }
  
  static getTemplateById(id: string): PromptTemplate | null {
    const allTemplates = [
      ...PROMPT_DATA.templates.whyCompany,
      ...PROMPT_DATA.templates.behavioral,
      ...PROMPT_DATA.templates.general
    ];
    return allTemplates.find(template => template.id === id) || null;
  }
  
  static createFallbackTemplate(mode: JobGPTMode): PromptTemplate {
    return {
      id: `fallback-${mode}`,
      mode,
      name: "Fallback Template",
      description: "Basic fallback template",
      systemPrompt: PROMPT_DATA.systemPrompts.base,
      userTemplate: "{userInput}",
      variables: ["userInput"]
    };
  }
  
  static extractVariables(template: string): string[] {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }
  
  static validateTemplate(template: PromptTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.id) errors.push("Template ID is required");
    if (!template.mode) errors.push("Template mode is required");
    if (!template.systemPrompt) errors.push("System prompt is required");
    if (!template.userTemplate) errors.push("User template is required");
    
    // Validate that all declared variables exist in the template
    const templateVariables = this.extractVariables(template.userTemplate);
    const declaredVariables = template.variables || [];
    
    for (const variable of declaredVariables) {
      if (!templateVariables.includes(variable)) {
        errors.push(`Declared variable '${variable}' not found in template`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}