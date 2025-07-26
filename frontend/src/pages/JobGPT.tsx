import React, { useState } from 'react';
import { FileText, Upload, ThumbsUp } from 'lucide-react';
import { jobgptService } from '../services/jobgptService';
import { JobGPTMode, JobGPTState, DeepseekModel } from '../types/jobgpt';

const initialState: JobGPTState = {
  mode: 'why_company',
  model: 'deepseek-coder-6.7b',
  isLoading: false,
  error: null,
  input: '',
  output: '',
};

// Define model options with display names and categories
interface ModelOption {
  value: DeepseekModel;
  label: string;
  category: 'Deepseek' | 'OpenAI';
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: 'deepseek-coder-6.7b', label: 'Deepseek Coder (6.7B)', category: 'Deepseek' },
  { value: 'deepseek-coder-33b', label: 'Deepseek Coder (33B)', category: 'Deepseek' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', category: 'OpenAI' },
  { value: 'gpt-4', label: 'GPT-4', category: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', category: 'OpenAI' }
];

// Extract just the model values for use in other parts of the code
const MODELS: DeepseekModel[] = MODEL_OPTIONS.map(option => option.value);

export function JobGPT() {
  const [state, setState] = useState<JobGPTState>(initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleModeChange = (mode: JobGPTMode) => {
    setState({ ...state, mode, input: '', output: '', error: null });
  };

  const handleModelChange = (model: DeepseekModel) => {
    setState({ ...state, model });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState({ ...state, input: e.target.value });
  };

  const handleSubmit = async () => {
    if (!state.input.trim()) {
      setState({ ...state, error: 'Please enter some text' });
      return;
    }

    setState({ ...state, isLoading: true, error: null });

    try {
      const response = await jobgptService.generatePrompt(state.input, state.mode, state.model);
      setState({ 
        ...state, 
        isLoading: false, 
        output: response.response,
        lastResponse: response
      });  
    } catch (error: any) {
      setState({ ...state, isLoading: false, error: error.message });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setState({ ...state, error: 'Please select a file' });
      return;
    }

    setState({ ...state, isLoading: true, error: null });

    try {
      const response = await jobgptService.uploadResume(selectedFile);
      if (response.file_url) {
        // Handle successful upload
        setState({ ...state, isLoading: false });
      }
    } catch (error: any) {
      setState({ ...state, isLoading: false, error: error.message });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">JobGPT Assistant</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          JobGPT is an AI-powered job assistant that helps you create cover letters,
          improve your resume, and generate professional recommendations.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${state.mode === 'why_company' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleModeChange('why_company')}
          >
            Why Company
          </button>
          <button
            className={`px-4 py-2 rounded ${state.mode === 'behavioral' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleModeChange('behavioral')}
          >
            Behavioral
          </button>
          <button
            className={`px-4 py-2 rounded ${state.mode === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleModeChange('general')}
          >
            General
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <select
            className="w-full p-2 border rounded bg-white"
            value={state.model}
            onChange={(e) => handleModelChange(e.target.value as DeepseekModel)}
          >
            <optgroup label="Deepseek Models">
              {MODEL_OPTIONS.filter(option => option.category === 'Deepseek').map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="OpenAI Models">
              {MODEL_OPTIONS.filter(option => option.category === 'OpenAI').map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        
        <textarea
          className="w-full h-32 p-2 border rounded mb-4"
          placeholder={getPlaceholder(state.mode)}
          value={state.input}
          onChange={handleInputChange}
        />
        
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Generating...' : 'Generate'}
          </button>
          {state.isLoading && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">
                Using {MODEL_OPTIONS.find(option => option.value === state.model)?.label || state.model}
              </span>
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      {state.output && (
        <div className="bg-gray-100 p-4 rounded">
          <div className="flex items-center mb-2 flex-wrap gap-2">
            <h2 className="font-bold">Generated Response:</h2>
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {MODEL_OPTIONS.find(option => option.value === state.model)?.label || state.model}
            </span>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              {state.mode === 'why_company' ? 'Why Company' : 
               state.mode === 'behavioral' ? 'Behavioral' : 'General'}
            </span>
            {state.lastResponse?.templateUsed && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Template: {state.lastResponse.templateUsed}
              </span>
            )}
            {state.lastResponse?.processingTime && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                {state.lastResponse.processingTime}ms
              </span>
            )}
          </div>
          <div className="mb-2">
            <p className="whitespace-pre-wrap">{state.output}</p>
          </div>
          {state.lastResponse?.usage && (
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
              <span>Tokens: {state.lastResponse.usage.totalTokens} total</span>
              <span className="ml-4">({state.lastResponse.usage.promptTokens} prompt + {state.lastResponse.usage.completionTokens} completion)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getPlaceholder(mode: JobGPTMode): string {
  switch (mode) {
    case 'why_company':
      return 'Enter the company name...';
    case 'behavioral':
      return 'Enter the behavioral question...';
    case 'general':
      return 'Enter your prompt...';
    default:
      return 'Enter your text here...';
  }
}
