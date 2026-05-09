import type { Meta, StoryObj } from '@storybook/react';
import SearchBar from './SearchBar';

const meta = {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InContainer: Story = {
  render: () => (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Your Next Opportunity</h2>
      <SearchBar />
    </div>
  ),
};

export const InHero: Story = {
  render: () => (
    <div className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Job Search Made Simple</h1>
          <p className="text-xl text-indigo-100">Search jobs, companies, and opportunities all in one place</p>
        </div>
        <div className="flex justify-center">
          <SearchBar />
        </div>
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <label htmlFor="search" className="block text-sm font-medium text-gray-900 mb-2">
        Search
      </label>
      <SearchBar />
    </div>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Mobile</h3>
        <div className="border border-gray-300 rounded-lg p-4 w-80 bg-white">
          <SearchBar />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tablet</h3>
        <div className="border border-gray-300 rounded-lg p-4 w-full bg-white">
          <SearchBar />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Desktop</h3>
        <div className="border border-gray-300 rounded-lg p-4 w-full bg-white">
          <SearchBar />
        </div>
      </div>
    </div>
  ),
};

export const DifferentBackgrounds: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 mb-3">On white background</p>
        <SearchBar />
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 mb-3">On light gray background</p>
        <SearchBar />
      </div>

      <div className="bg-gray-100 p-6 rounded-lg border border-gray-300">
        <p className="text-sm text-gray-600 mb-3">On medium gray background</p>
        <SearchBar />
      </div>

      <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
        <p className="text-sm text-gray-600 mb-3">On indigo background</p>
        <SearchBar />
      </div>
    </div>
  ),
};
