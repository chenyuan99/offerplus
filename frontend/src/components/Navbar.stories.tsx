import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

const meta = {
  title: 'Components/Navbar',
  component: Navbar,
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
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isMenuOpen: false,
    setIsMenuOpen: () => {},
  },
};

export const MenuOpen: Story = {
  args: {
    isMenuOpen: true,
    setIsMenuOpen: () => {},
  },
};

export const WithBackground: Story = {
  args: {
    isMenuOpen: false,
    setIsMenuOpen: () => {},
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-50">
        <BrowserRouter>
          <Story />
        </BrowserRouter>
        <div className="pt-20 px-8 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Content</h1>
          <p className="text-gray-600">This shows the navbar with page content below it.</p>
        </div>
      </div>
    ),
  ],
};

export const ScreenSizeExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Desktop View</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="w-full bg-white">
            <BrowserRouter>
              <Navbar isMenuOpen={false} setIsMenuOpen={() => {}} />
            </BrowserRouter>
            <div className="pt-20 px-8 h-32 bg-gray-50"></div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Mobile View (Menu Open)</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="w-96 bg-white">
            <BrowserRouter>
              <Navbar isMenuOpen={true} setIsMenuOpen={() => {}} />
            </BrowserRouter>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const NavbarVariations: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Collapsed Menu</h3>
        <BrowserRouter>
          <Navbar isMenuOpen={false} setIsMenuOpen={() => {}} />
        </BrowserRouter>
        <div className="h-32 bg-gray-100"></div>
      </div>

      <hr className="my-8" />

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Expanded Mobile Menu</h3>
        <BrowserRouter>
          <Navbar isMenuOpen={true} setIsMenuOpen={() => {}} />
        </BrowserRouter>
      </div>
    </div>
  ),
};
