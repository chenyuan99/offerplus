import type { Meta, StoryObj } from '@storybook/react';
import FeatureCard from './FeatureCard';
import { Zap, Globe, Lock, Sparkles } from 'lucide-react';

const meta = {
  title: 'Components/FeatureCard',
  component: FeatureCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeatureCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get insights and feedback in real-time with our advanced AI algorithms.',
  },
};

export const Security: Story = {
  args: {
    icon: Lock,
    title: 'Secure & Private',
    description: 'Your data is encrypted and stored securely with enterprise-grade protection.',
  },
};

export const Global: Story = {
  args: {
    icon: Globe,
    title: 'Global Reach',
    description: 'Access opportunities from companies around the world.',
  },
};

export const Premium: Story = {
  args: {
    icon: Sparkles,
    title: 'Premium Features',
    description: 'Unlock advanced tools to enhance your job search experience.',
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <FeatureCard icon={Zap} title="Fast" description="Lightning quick processing" />
      <FeatureCard icon={Lock} title="Secure" description="Enterprise security" />
      <FeatureCard icon={Globe} title="Global" description="Worldwide access" />
      <FeatureCard icon={Sparkles} title="Premium" description="Advanced features" />
    </div>
  ),
};
