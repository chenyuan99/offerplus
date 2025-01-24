import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../components/SearchBar';

describe('SearchBar', () => {
  it('renders the search input', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/search for jobs/i)).toBeInTheDocument();
  });

  it('allows typing in the search input', async () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search for jobs/i);
    await userEvent.type(input, 'software engineer');
    expect(input).toHaveValue('software engineer');
  });

  it('renders the search icon', () => {
    render(<SearchBar />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
