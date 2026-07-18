import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import type { ApplicationRecord } from '../types';

let mockApplications: ApplicationRecord[] = [];

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: mockApplications, error: null }),
      }),
    }),
  },
}));

function makeApplication(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return {
    id: 1,
    job_title: 'Backend Engineer',
    job_link: '',
    company_link: 'https://example.com',
    status: 'applied',
    date_applied: '2026-01-01',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  } as ApplicationRecord;
}

const renderDashboard = (initialEntries: string[] = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard', () => {
  beforeEach(() => {
    mockApplications = [];
  });

  it('invites the user to add their first application when they have none at all', async () => {
    renderDashboard();
    expect(await screen.findByText('No applications found')).toBeInTheDocument();
    expect(screen.getByText('Add your first application')).toBeInTheDocument();
  });

  it('distinguishes "no search matches" from "no applications yet"', async () => {
    mockApplications = [makeApplication({ job_title: 'Backend Engineer' })];
    renderDashboard();
    await screen.findByText('Backend Engineer');

    fireEvent.change(screen.getByPlaceholderText(/search by job title or company/i), {
      target: { value: 'nonexistent role' },
    });

    expect(await screen.findByText('No matches for “nonexistent role”')).toBeInTheDocument();
    expect(screen.getByText('Clear search')).toBeInTheDocument();
    expect(screen.queryByText('Add your first application')).not.toBeInTheDocument();
    expect(screen.queryByText('No applications found')).not.toBeInTheDocument();
  });

  it('restores the list when "Clear search" is clicked', async () => {
    mockApplications = [makeApplication({ job_title: 'Backend Engineer' })];
    renderDashboard();
    await screen.findByText('Backend Engineer');

    fireEvent.change(screen.getByPlaceholderText(/search by job title or company/i), {
      target: { value: 'nonexistent role' },
    });
    fireEvent.click(await screen.findByText('Clear search'));

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument();
  });

  it('shows a filter-specific empty state when a status filter matches nothing', async () => {
    mockApplications = [makeApplication({ status: 'applied' })];
    renderDashboard(['/?status=offer']);

    expect(await screen.findByText('No applications match this filter')).toBeInTheDocument();
    expect(screen.getByText('Clear filter')).toBeInTheDocument();
    expect(screen.queryByText('Add your first application')).not.toBeInTheDocument();
  });

  it('gives company logos explicit dimensions to avoid layout shift', async () => {
    mockApplications = [makeApplication()];
    renderDashboard();

    const logo = await screen.findByAltText('Company logo');
    expect(logo).toHaveAttribute('width', '40');
    expect(logo).toHaveAttribute('height', '40');
  });

  it('labels the refresh action honestly instead of implying a Gmail sync', async () => {
    mockApplications = [makeApplication()];
    renderDashboard();
    await screen.findByText('Backend Engineer');

    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.queryByText('Sync')).not.toBeInTheDocument();
  });
});
