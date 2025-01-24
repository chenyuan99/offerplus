import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Landing } from '../components/Landing';

describe('Landing', () => {
  const renderLanding = () => {
    return render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
  };

  it('renders the hero section', () => {
    renderLanding();
    expect(screen.getByText('Find Your Dream Job')).toBeInTheDocument();
    expect(screen.getByText('Advance Your Career')).toBeInTheDocument();
  });

  it('renders the features section', () => {
    renderLanding();
    expect(screen.getByText('Smart Job Matching')).toBeInTheDocument();
    expect(screen.getByText('Salary Insights')).toBeInTheDocument();
    expect(screen.getByText('Company Reviews')).toBeInTheDocument();
    expect(screen.getByText('Verified Employers')).toBeInTheDocument();
  });

  it('renders the navigation buttons', () => {
    renderLanding();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    renderLanding();
    expect(screen.getByPlaceholderText(/search for jobs/i)).toBeInTheDocument();
  });
});
