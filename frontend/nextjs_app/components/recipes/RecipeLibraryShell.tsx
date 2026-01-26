/**
 * RecipeLibraryShell Component
 *
 * Main shell component for the recipe library page.
 */
'use client';

import { RecipeGrid } from './RecipeGrid';
import { RecipeFiltersBar } from './RecipeFiltersBar';
import { SearchBar } from './SearchBar';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeFilters } from '@/hooks/useRecipeFilters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, RefreshCw, Filter, X } from 'lucide-react';
import { useState } from 'react';

export function RecipeLibraryShell() {
  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    getQueryParams,
    debouncedSearch
  } = useRecipeFilters();

  const { recipes, stats, loading, error, bookmarks, refetch, isStale } = useRecipes(getQueryParams());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-indigo-900/50">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <BookOpen className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-2 rounded-2xl shadow-lg shadow-emerald-500/30" />
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-400 via-white to-emerald-400 bg-clip-text text-transparent">
                    Recipe Library
                  </h1>
                  <p className="text-xl text-slate-300 mt-2">
                    {loading ? 'Loading recipes...' : `${stats.total} recipes ${stats.bookmarked > 0 ? `• ${stats.bookmarked} saved` : ''}`}
                  </p>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetch()}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <SearchBar value={filters.search || ''} onChange={(value) => updateFilter('search', value)} />
          </div>

          {/* Desktop Filters */}
          <div className="mt-6">
            <RecipeFiltersBar
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters()}
              onDebouncedSearch={debouncedSearch}
            />
          </div>
        </div>
      </div>

      {/* RECIPE GRID */}
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <RecipeGrid recipes={recipes} bookmarks={bookmarks} loading={loading} />
      </div>
    </div>
  );
}


