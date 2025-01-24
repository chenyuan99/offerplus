import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

describe('Navbar', () => {
  const renderNavbar = (props = {}) => {
    return render(
      <BrowserRouter>
        <Navbar isMenuOpen={false} setIsMenuOpen={() => {}} {...props} />
      </BrowserRouter>
    );
  };

  it('renders the logo', () => {
    renderNavbar();
    expect(screen.getByText('OffersPlus')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderNavbar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    const setIsMenuOpen = vi.fn();
    renderNavbar({ isMenuOpen: false, setIsMenuOpen });
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    expect(setIsMenuOpen).toHaveBeenCalledWith(true);
  });
});
