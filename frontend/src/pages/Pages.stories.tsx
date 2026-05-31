import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';

const meta = {
  title: 'Pages/Layouts',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const LoginLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-4xl font-bold text-[#861F41] mb-2">OfferPlus</h1>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="#" className="font-medium text-[#861F41] hover:text-[#621531]">
            create a new account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861F41] focus:border-[#861F41]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861F41] focus:border-[#861F41]"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861F41] hover:bg-[#621531]">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const RegisterLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-4xl font-bold text-[#861F41] mb-2">OfferPlus</h1>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="#" className="font-medium text-[#861F41] hover:text-[#621531]">
            sign in to your existing account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861F41] focus:border-[#861F41]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861F41] focus:border-[#861F41]"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#861F41] focus:border-[#861F41]"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#861F41] hover:bg-[#621531]">
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const DashboardLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#861F41]">OfferPlus</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Dashboard
              </a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Add Application
              </a>
              <button className="px-3 py-2 text-sm font-medium text-white bg-[#861F41] rounded-md hover:bg-[#621531]">
                Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">8</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Interviews</p>
            <p className="text-3xl font-bold text-green-600 mt-2">5</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
          </div>
          <div className="divide-y">
            {[
              { company: 'Google', position: 'Software Engineer', date: '2024-01-15', status: 'Interview' },
              { company: 'Microsoft', position: 'Product Manager', date: '2024-01-14', status: 'Applied' },
              { company: 'Amazon', position: 'Data Engineer', date: '2024-01-13', status: 'Rejected' },
              { company: 'Apple', position: 'iOS Developer', date: '2024-01-12', status: 'Applied' },
              { company: 'Meta', position: 'ML Engineer', date: '2024-01-11', status: 'Interview' },
            ].map((app, idx) => (
              <div key={idx} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{app.company}</p>
                  <p className="text-sm text-gray-600">{app.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{app.date}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      app.status === 'Interview'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};

export const EmptyDashboard: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#861F41]">OfferPlus</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Dashboard
              </a>
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Add Application
              </a>
              <button className="px-3 py-2 text-sm font-medium text-white bg-[#861F41] rounded-md hover:bg-[#621531]">
                Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No applications yet</h2>
          <p className="text-gray-600 mb-8">Start tracking your job applications to see them appear here</p>
          <button className="px-6 py-3 bg-[#861F41] text-white rounded-lg hover:bg-[#621531] font-medium">
            Add Your First Application
          </button>
        </div>
      </div>
    </div>
  ),
};
