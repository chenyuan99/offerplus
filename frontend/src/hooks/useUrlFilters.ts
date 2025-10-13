import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { H1BFilters } from '../types/h1b';

interface UseUrlFiltersOptions {
  defaultFilters?: Partial<H1BFilters>;
  debounceMs?: number;
}

interface UseUrlFiltersReturn {
  filters: H1BFilters;
  updateFilters: (newFilters: Partial<H1BFilters>) => void;
  clearFilters: () => void;
  setFiltersFromUrl: (urlFilters: Partial<H1BFilters>) => void;
  getShareableUrl: () => string;
}

/**
 * Custom hook for managing H1B filters with URL query parameter synchronization
 */
export function useUrlFilters(options: UseUrlFiltersOptions = {}): UseUrlFiltersReturn {
  const { defaultFilters = {}, debounceMs = 500 } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Default filter state (memoized to prevent recreations)
  const getDefaultFilters = useCallback((): H1BFilters => ({
    employer: '',
    status: '',
    jobTitle: '',
    minSalary: null,
    maxSalary: null,
    searchTerm: '',
    ...defaultFilters
  }), []); // Empty dependency array since defaultFilters should be stable

  // Parse filters from URL query parameters
  const parseFiltersFromUrl = useCallback((): H1BFilters => {
    const urlFilters: Partial<H1BFilters> = {};

    // Parse string filters
    const employer = searchParams.get('employer');
    if (employer) urlFilters.employer = employer;

    const status = searchParams.get('status');
    if (status) urlFilters.status = status;

    const jobTitle = searchParams.get('jobTitle') || searchParams.get('job_title');
    if (jobTitle) urlFilters.jobTitle = jobTitle;

    const searchTerm = searchParams.get('search') || searchParams.get('q');
    if (searchTerm) urlFilters.searchTerm = searchTerm;

    // Parse numeric filters
    const minSalary = searchParams.get('minSalary') || searchParams.get('min_salary');
    if (minSalary && !isNaN(Number(minSalary))) {
      urlFilters.minSalary = Number(minSalary);
    }

    const maxSalary = searchParams.get('maxSalary') || searchParams.get('max_salary');
    if (maxSalary && !isNaN(Number(maxSalary))) {
      urlFilters.maxSalary = Number(maxSalary);
    }

    return { ...getDefaultFilters(), ...urlFilters };
  }, [searchParams]); // Remove defaultFilters from dependencies to prevent infinite loop

  // Initialize filters from URL or defaults
  const [filters, setFilters] = useState<H1BFilters>(() => {
    // Parse initial filters without using the callback to avoid dependency issues
    const urlFilters: Partial<H1BFilters> = {};
    
    const employer = searchParams.get('employer');
    if (employer) urlFilters.employer = employer;

    const status = searchParams.get('status');
    if (status) urlFilters.status = status;

    const jobTitle = searchParams.get('jobTitle') || searchParams.get('job_title');
    if (jobTitle) urlFilters.jobTitle = jobTitle;

    const searchTerm = searchParams.get('search') || searchParams.get('q');
    if (searchTerm) urlFilters.searchTerm = searchTerm;

    const minSalary = searchParams.get('minSalary') || searchParams.get('min_salary');
    if (minSalary && !isNaN(Number(minSalary))) {
      urlFilters.minSalary = Number(minSalary);
    }

    const maxSalary = searchParams.get('maxSalary') || searchParams.get('max_salary');
    if (maxSalary && !isNaN(Number(maxSalary))) {
      urlFilters.maxSalary = Number(maxSalary);
    }

    return {
      employer: '',
      status: '',
      jobTitle: '',
      minSalary: null,
      maxSalary: null,
      searchTerm: '',
      ...defaultFilters,
      ...urlFilters
    };
  });

  // Update URL when filters change (with debouncing)
  const updateUrlFromFilters = useCallback((newFilters: H1BFilters) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      // Add non-empty string filters
      if (newFilters.employer) params.set('employer', newFilters.employer);
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.jobTitle) params.set('jobTitle', newFilters.jobTitle);
      if (newFilters.searchTerm) params.set('search', newFilters.searchTerm);

      // Add numeric filters
      if (newFilters.minSalary !== null && newFilters.minSalary !== undefined) {
        params.set('minSalary', newFilters.minSalary.toString());
      }
      if (newFilters.maxSalary !== null && newFilters.maxSalary !== undefined) {
        params.set('maxSalary', newFilters.maxSalary.toString());
      }

      // Update URL without causing a page reload
      setSearchParams(params, { replace: true });
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [debounceTimeout, debounceMs, setSearchParams]);

  // Update filters and sync with URL
  const updateFilters = useCallback((newFilters: Partial<H1BFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateUrlFromFilters(updatedFilters);
  }, [filters, updateUrlFromFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = getDefaultFilters();
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Set filters from URL (useful for programmatic updates)
  const setFiltersFromUrl = useCallback((urlFilters: Partial<H1BFilters>) => {
    const updatedFilters = { ...getDefaultFilters(), ...urlFilters };
    setFilters(updatedFilters);
    updateUrlFromFilters(updatedFilters);
  }, [updateUrlFromFilters]);

  // Get shareable URL with current filters
  const getShareableUrl = useCallback((): string => {
    const params = new URLSearchParams();

    if (filters.employer) params.set('employer', filters.employer);
    if (filters.status) params.set('status', filters.status);
    if (filters.jobTitle) params.set('jobTitle', filters.jobTitle);
    if (filters.searchTerm) params.set('search', filters.searchTerm);
    if (filters.minSalary !== null && filters.minSalary !== undefined) {
      params.set('minSalary', filters.minSalary.toString());
    }
    if (filters.maxSalary !== null && filters.maxSalary !== undefined) {
      params.set('maxSalary', filters.maxSalary.toString());
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [filters]);

  // Sync filters when URL changes (browser back/forward)
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl();
    
    // Only update if filters actually changed to prevent infinite loops
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(urlFilters);
    if (filtersChanged) {
      setFilters(urlFilters);
    }
  }, [searchParams, parseFiltersFromUrl]); // Include parseFiltersFromUrl since it's now memoized

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return {
    filters,
    updateFilters,
    clearFilters,
    setFiltersFromUrl,
    getShareableUrl
  };
}

/**
 * Utility function to create shareable URLs with specific filters
 */
export function createH1BFilterUrl(filters: Partial<H1BFilters>, baseUrl?: string): string {
  const params = new URLSearchParams();

  if (filters.employer) params.set('employer', filters.employer);
  if (filters.status) params.set('status', filters.status);
  if (filters.jobTitle) params.set('jobTitle', filters.jobTitle);
  if (filters.searchTerm) params.set('search', filters.searchTerm);
  if (filters.minSalary !== null && filters.minSalary !== undefined) {
    params.set('minSalary', filters.minSalary.toString());
  }
  if (filters.maxSalary !== null && filters.maxSalary !== undefined) {
    params.set('maxSalary', filters.maxSalary.toString());
  }

  const base = baseUrl || `${window.location.origin}/h1b`;
  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Utility function to parse H1B filters from a URL string
 */
export function parseH1BFiltersFromUrl(url: string): Partial<H1BFilters> {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    const filters: Partial<H1BFilters> = {};

    const employer = params.get('employer');
    if (employer) filters.employer = employer;

    const status = params.get('status');
    if (status) filters.status = status;

    const jobTitle = params.get('jobTitle') || params.get('job_title');
    if (jobTitle) filters.jobTitle = jobTitle;

    const searchTerm = params.get('search') || params.get('q');
    if (searchTerm) filters.searchTerm = searchTerm;

    const minSalary = params.get('minSalary') || params.get('min_salary');
    if (minSalary && !isNaN(Number(minSalary))) {
      filters.minSalary = Number(minSalary);
    }

    const maxSalary = params.get('maxSalary') || params.get('max_salary');
    if (maxSalary && !isNaN(Number(maxSalary))) {
      filters.maxSalary = Number(maxSalary);
    }

    return filters;
  } catch (error) {
    console.error('Error parsing H1B filters from URL:', error);
    return {};
  }
}