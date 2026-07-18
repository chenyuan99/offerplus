import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: { user: { email: 'jane@offerplus.dev' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
  },
}));

describe('Navbar (signed in)', () => {
  const renderNavbar = () =>
    render(
      <BrowserRouter>
        <Navbar isMenuOpen={false} setIsMenuOpen={() => {}} />
      </BrowserRouter>
    );

  it('renders the signed-in user menu instead of Login/Register', async () => {
    renderNavbar();
    expect(await screen.findByText('jane@offerplus.dev')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('gives the user-menu button a visible focus ring instead of a silently removed outline', async () => {
    renderNavbar();
    const label = await screen.findByText('jane@offerplus.dev');
    const button = label.closest('button');
    expect(button).not.toBeNull();
    expect(button?.className).toContain('focus-visible:ring');
  });
});
