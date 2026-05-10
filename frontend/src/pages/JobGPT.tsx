import React, { useState, useEffect } from 'react';
import { FileText, Upload, ThumbsUp, AlertCircle, Zap } from 'lucide-react';
import { jobgptService } from '../services/jobgptService';
import { AIModelManager } from '../lib/aiModelAdapters';
import { JobGPTMode, JobGPTState, AIModel } from '../types/jobgpt';

const initialState: JobGPTState = {
  mode: 'why_company',
  model: 'gpt-5-mini',
  isLoading: false,
  error: null,
  input: '',
  output: '',
};

// Define model options with display names
interface ModelOption {
  value: string;
  label: string;
}

export function JobGPT() {
  const [state, setState] = useState<JobGPTState>(initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ]);
  const [showPrompts, setShowPrompts] = useState(false);

  useEffect(() => {
    const loadAvailableModels = async () => {
      try {
        const models = await AIModelManager.fetchOpenAIModels();
        const options = models.map(model => ({
          value: model,
          label: model.replace(/-/g, ' ').replace(/^./, str => str.toUpperCase())
        }));
        setModelOptions(options);

        // If current model is not available, switch to first available
        if (!models.includes(state.model)) {
          setState(prev => ({ ...prev, model: models[0] as AIModel }));
        }
      } catch (error) {
        console.error('Failed to load available models:', error);
        // Fall back to default models on error
      }
    };

    loadAvailableModels();
  }, []);

  const handleModeChange = (mode: JobGPTMode) => {
    setState({ ...state, mode, input: '', output: '', error: null });
  };

  const handleModelChange = (model: AIModel) => {
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
      console.log('JobGPT response received:', {
        hasResponse: !!response.response,
        responseLength: response.response?.length,
        response: response
      });
      setState(prevState => {
        const newState = {
          ...prevState,
          isLoading: false,
          output: response.response,
          lastResponse: response
        };
        console.log('State updated:', newState);
        return newState;
      });
    } catch (error: any) {
      console.error('JobGPT error:', error);
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
    } catch (error: unknown) {
      setState({ ...state, isLoading: false, error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-8 w-8 text-[#861F41]" />
            <h1 className="text-4xl font-bold text-gray-900">JobGPT Assistant</h1>
          </div>
          <p className="mt-2 text-gray-600 max-w-3xl">
            AI-powered assistant to help you craft compelling cover letters, improve your resume, and prepare for interviews.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Mode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { mode: 'why_company' as JobGPTMode, label: 'Why Company', description: 'Company fit answers' },
              { mode: 'behavioral' as JobGPTMode, label: 'Behavioral', description: 'Interview questions' },
              { mode: 'general' as JobGPTMode, label: 'General', description: 'Custom prompts' }
            ].map(({ mode, label, description }) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  state.mode === mode
                    ? 'border-[#861F41] bg-[#861F41]/10 text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-500 mt-1">{description}</div>
              </button>
            ))}
          </div>

          {/* Model Selection */}
          <div className="mb-6">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              AI Model
            </label>
            <select
              id="model"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
              value={state.model}
              onChange={(e) => handleModelChange(e.target.value as AIModel)}
            >
              {modelOptions.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* Input Textarea */}
          <div className="mb-6">
            <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
              {state.mode === 'why_company' ? 'Company Name' : state.mode === 'behavioral' ? 'Question' : 'Your Prompt'}
            </label>
            <textarea
              id="input"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41] resize-none"
              placeholder={getPlaceholder(state.mode)}
              value={state.input}
              onChange={handleInputChange}
            />
          </div>

          {/* Error Alert */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{state.error}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={state.isLoading}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#861F41] text-white rounded-md hover:bg-[#621531] focus:outline-none focus:ring-2 focus:ring-[#861F41] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {state.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generate
                </>
              )}
            </button>
            {state.isLoading && (
              <span className="text-sm text-gray-600">
                Using {modelOptions.find(option => option.value === state.model)?.label || state.model}
              </span>
            )}
          </div>
        </div>

        {/* Output Section */}
        {state.output && (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Prompts Section */}
            {(state.lastResponse?.systemPrompt || state.lastResponse?.userPrompt) && (
              <div className="mb-6 border-b border-gray-200 pb-4">
                <button
                  onClick={() => setShowPrompts(!showPrompts)}
                  className="flex items-center justify-between w-full text-left hover:text-[#861F41] transition-colors"
                >
                  <h3 className="text-sm font-medium text-gray-700">View Prompts</h3>
                  <span className={`transform transition-transform ${showPrompts ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {showPrompts && (
                  <div className="mt-4 space-y-4">
                    {state.lastResponse?.systemPrompt && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 mb-2">System Prompt</h4>
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto border border-gray-200">
                          {state.lastResponse.systemPrompt}
                        </div>
                      </div>
                    )}
                    {state.lastResponse?.userPrompt && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 mb-2">User Prompt</h4>
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto border border-gray-200">
                          {state.lastResponse.userPrompt}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Generated Response</h2>
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#861F41]/10 text-[#861F41]">
                  {modelOptions.find(option => option.value === state.model)?.label || state.model}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {state.mode === 'why_company' ? 'Why Company' :
                    state.mode === 'behavioral' ? 'Behavioral' : 'General'}
                </span>
                {state.lastResponse?.templateUsed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    Template: {state.lastResponse.templateUsed}
                  </span>
                )}
                {state.lastResponse?.processingTime && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    {state.lastResponse.processingTime}ms
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{state.output}</p>
            </div>

            {state.lastResponse?.usage && (
              <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                <div className="space-y-1">
                  <div>Tokens used: {state.lastResponse.usage.totalTokens} total</div>
                  <div className="text-gray-400">
                    ({state.lastResponse.usage.promptTokens} prompt + {state.lastResponse.usage.completionTokens} completion)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
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
