import type { Meta, StoryObj } from '@storybook/react';
import { CompanyLogo } from './CompanyLogo';

const meta = {
  title: 'Components/CompanyLogo',
  component: CompanyLogo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CompanyLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companyName: 'Google',
    size: 40,
  },
};

export const Large: Story = {
  args: {
    companyName: 'Microsoft',
    size: 80,
  },
};

export const Small: Story = {
  args: {
    companyName: 'Apple',
    size: 24,
  },
};

export const ExtraLarge: Story = {
  args: {
    companyName: 'Amazon',
    size: 120,
  },
};

export const MultipleSizes: Story = {
  render: () => (
    <div className="flex gap-8 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Google" size={24} />
        <span className="text-xs">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Microsoft" size={40} />
        <span className="text-xs">40px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Apple" size={64} />
        <span className="text-xs">64px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Amazon" size={80} />
        <span className="text-xs">80px</span>
      </div>
    </div>
  ),
};

export const MultipleCompanies: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-8">
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Google" size={64} />
        <span className="text-sm">Google</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Microsoft" size={64} />
        <span className="text-sm">Microsoft</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Apple" size={64} />
        <span className="text-sm">Apple</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Amazon" size={64} />
        <span className="text-sm">Amazon</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Meta" size={64} />
        <span className="text-sm">Meta</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Netflix" size={64} />
        <span className="text-sm">Netflix</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="Tesla" size={64} />
        <span className="text-sm">Tesla</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CompanyLogo companyName="NVIDIA" size={64} />
        <span className="text-sm">NVIDIA</span>
      </div>
    </div>
  ),
};
