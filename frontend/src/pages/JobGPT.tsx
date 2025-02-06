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

const MODELS: DeepseekModel[] = [
  'deepseek-coder-6.7b',
  'deepseek-coder-33b'
];

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
      setState({ ...state, isLoading: false, output: response.response });  
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
            {MODELS.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
        
        <textarea
          className="w-full h-32 p-2 border rounded mb-4"
          placeholder={getPlaceholder(state.mode)}
          value={state.input}
          onChange={handleInputChange}
        />
        
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          onClick={handleSubmit}
          disabled={state.isLoading}
        >
          {state.isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      {state.output && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Generated Response:</h2>
          <p className="whitespace-pre-wrap">{state.output}</p>
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
