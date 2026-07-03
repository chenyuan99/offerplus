import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Landing } from '../components/Landing';

describe('Landing', () => {
  const renderLanding = () => {
    return render(
      <HelmetProvider>
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  it('renders the hero section', () => {
    renderLanding();
    expect(screen.getByText('Track Your Job Applications with Ease')).toBeInTheDocument();
  });

  it('renders the features section', () => {
    renderLanding();
    expect(screen.getByText('Application Tracking')).toBeInTheDocument();
    expect(screen.getByText('Resume Management')).toBeInTheDocument();
    expect(screen.getByText('Progress Insights')).toBeInTheDocument();
  });

  it('renders the navigation buttons', () => {
    renderLanding();
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });
});
