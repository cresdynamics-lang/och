/**
 * useRecipeFilters Hook
 *
 * Manages recipe filter state with URL synchronization and debounced search.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export type RecipeFilterState = {
  track: string;
  level: string;
  skill: string;
  time: string;
  search: string;
};

export type RecipeQueryParams = {
  track_code?: string;
  level?: string;
  skill_code?: string;
  max_duration?: number;
  search?: string;
};

export function useRecipeFilters(initialFilters: Partial<RecipeFilterState> = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<RecipeFilterState>({
    track: initialFilters.track || searchParams.get('track') || '',
    level: initialFilters.level || searchParams.get('level') || '',
    skill: initialFilters.skill || searchParams.get('skill') || '',
    time: initialFilters.time || searchParams.get('time') || '',
    search: initialFilters.search || searchParams.get('search') || '',
  });

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useDebouncedCallback((searchValue: string) => {
    setFilters(prev => ({ ...prev, search: searchValue }));
  }, 300);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.track) params.set('track', filters.track);
    if (filters.level) params.set('level', filters.level);
    if (filters.skill) params.set('skill', filters.skill);
    if (filters.time) params.set('time', filters.time);
    if (filters.search) params.set('search', filters.search);

    const queryString = params.toString();
    const newUrl = queryString ? `/dashboard/student/coaching/recipes?${queryString}` : '/dashboard/student/coaching/recipes';

    // Only update URL if it's different to avoid unnecessary navigation
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, router]);

  // Convert filters to API query params
  const getQueryParams = useCallback((): RecipeQueryParams => {
    const params: RecipeQueryParams = {};

    if (filters.track && filters.track !== 'all') {
      params.track_code = filters.track;
    }

    if (filters.level && filters.level !== 'all') {
      params.level = filters.level;
    }

    if (filters.skill && filters.skill !== 'all') {
      params.skill_code = filters.skill;
    }

    if (filters.time && filters.time !== 'any') {
      // Map time filter to max_duration
      const timeMap: Record<string, number> = {
        '15': 15,
        '30': 30,
        '60': 60,
      };
      params.max_duration = timeMap[filters.time];
    }

    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }

    return params;
  }, [filters]);

  // Update individual filter
  const updateFilter = useCallback((key: keyof RecipeFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      track: '',
      level: '',
      skill: '',
      time: '',
      search: '',
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return Object.values(filters).some(value => value && value !== 'all' && value !== 'any');
  }, [filters]);

  return {
    filters,
    updateFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
    getQueryParams,
    debouncedSearch,
  };
}
