import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

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
    expect(screen.getByText('OfferPlus')).toBeInTheDocument();
  });

  it('renders navigation links for a signed-out user', () => {
    renderNavbar();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    const setIsMenuOpen = vi.fn();
    renderNavbar({ isMenuOpen: false, setIsMenuOpen });
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    expect(setIsMenuOpen).toHaveBeenCalledWith(true);
  });
});
