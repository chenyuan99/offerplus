import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner, PulseLoader, BouncingDots, SkeletonLoader } from './LoadingSpinner';

const meta = {
  title: 'Components/Loading Spinners',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;

export const Spinner: StoryObj<typeof LoadingSpinner> = {
  args: {
    size: 'md',
    color: 'indigo',
  },
  render: (args) => <LoadingSpinner {...args} />,
};

export const SpinnerWithText: StoryObj<typeof LoadingSpinner> = {
  args: {
    size: 'md',
    color: 'blue',
    text: 'Loading...',
  },
  render: (args) => <LoadingSpinner {...args} />,
};

export const SpinnerSizes: StoryObj<typeof LoadingSpinner> = {
  render: () => (
    <div className="flex gap-8 items-center justify-center">
      <LoadingSpinner size="sm" color="indigo" text="Small" />
      <LoadingSpinner size="md" color="indigo" text="Medium" />
      <LoadingSpinner size="lg" color="indigo" text="Large" />
      <LoadingSpinner size="xl" color="indigo" text="Extra Large" />
    </div>
  ),
};

export const SpinnerColors: StoryObj<typeof LoadingSpinner> = {
  render: () => (
    <div className="flex gap-8 items-center justify-center">
      <LoadingSpinner size="md" color="blue" text="Blue" />
      <LoadingSpinner size="md" color="indigo" text="Indigo" />
      <LoadingSpinner size="md" color="green" text="Green" />
      <LoadingSpinner size="md" color="purple" text="Purple" />
      <LoadingSpinner size="md" color="gray" text="Gray" />
    </div>
  ),
};

export const Pulse: StoryObj<typeof PulseLoader> = {
  render: () => <PulseLoader />,
};

export const Bouncing: StoryObj<typeof BouncingDots> = {
  render: () => <BouncingDots />,
};

export const Skeleton: StoryObj<typeof SkeletonLoader> = {
  render: () => (
    <div className="w-64 p-4">
      <SkeletonLoader className="h-64 mb-4" />
      <SkeletonLoader />
    </div>
  ),
};

export const AllLoaders: StoryObj<typeof LoadingSpinner> = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Spinner:</span>
        <LoadingSpinner size="sm" color="indigo" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Pulse:</span>
        <PulseLoader />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Bouncing:</span>
        <BouncingDots />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Skeleton:</span>
        <SkeletonLoader className="h-4 w-32" />
      </div>
    </div>
  ),
};
