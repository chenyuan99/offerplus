import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Briefcase } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';

describe('FeatureCard', () => {
  const defaultProps = {
    icon: Briefcase,
    title: 'Test Title',
    description: 'Test Description'
  };

  it('renders the title and description', () => {
    render(<FeatureCard {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(<FeatureCard {...defaultProps} />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<FeatureCard {...defaultProps} />);
    expect(container.firstChild).toHaveClass('relative', 'p-6', 'bg-white', 'rounded-lg');
  });
});
