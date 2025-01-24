import React, { useState } from 'react';
import { FileText, Upload, ThumbsUp } from 'lucide-react';
import { jobgptService } from '../services/jobgptService';
import { JobGPTMode, JobGPTState } from '../types/jobgpt';

const initialState: JobGPTState = {
  mode: 'recommendation',
  isLoading: false,
  error: null,
  input: '',
  output: '',
};

export function JobGPT() {
  const [state, setState] = useState<JobGPTState>(initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleModeChange = (mode: JobGPTMode) => {
    setState({ ...state, mode, input: '', output: '', error: null });
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
      const response = await jobgptService.generatePrompt(state.input, state.mode);
      setState({ ...state, isLoading: false, output: response.prompt });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">JobGPT</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          JobGPT is an AI-powered job assistant that helps you create cover letters,
          improve your resume, and generate professional recommendations.
        </p>
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => handleModeChange('cover-letter')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            state.mode === 'cover-letter'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-5 h-5 mr-2" />
          Cover Letter
        </button>
        <button
          onClick={() => handleModeChange('resume')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            state.mode === 'resume'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-5 h-5 mr-2" />
          Resume
        </button>
        <button
          onClick={() => handleModeChange('recommendation')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            state.mode === 'recommendation'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ThumbsUp className="w-5 h-5 mr-2" />
          Recommendation
        </button>
      </div>

      {state.error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {state.error}
        </div>
      )}

      <div className="space-y-6">
        {state.mode === 'resume' ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
            <div className="space-y-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <button
                onClick={handleFileUpload}
                disabled={state.isLoading || !selectedFile}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {state.isLoading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Input</h2>
              <textarea
                value={state.input}
                onChange={handleInputChange}
                placeholder={
                  state.mode === 'cover-letter'
                    ? 'Enter job description and your qualifications...'
                    : 'Enter your experience and achievements...'
                }
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSubmit}
                disabled={state.isLoading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {state.isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {state.output && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Generated Content</h2>
                <textarea
                  value={state.output}
                  readOnly
                  className="w-full h-40 p-3 bg-gray-50 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
