
/**
 * useRecipes Hook
 *
 * Master hook for recipe library management.
 * Handles fetching, filtering, searching, and bookmarking recipes.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { recipesClient } from '@/services/recipesClient';
import { useRecipeFilters, type RecipeQueryParams } from './useRecipeFilters';
import type {
  Recipe,
  RecipeListResponse,
  RecipeFilters,
  RecipeStats,
  RecipeStatus,
} from '@/services/types/recipes';

interface UseRecipesOptions {
  autoFetch?: boolean;
  enableCache?: boolean;
}

interface UseRecipesResult {
  recipes: RecipeListResponse[];
  stats: RecipeStats;
  loading: boolean;
  error: string | null;
  bookmarks: string[];
  refetch: () => Promise<void>;
  isStale: boolean;
}

export function useRecipes(
  queryParams: RecipeQueryParams = {},
  options: UseRecipesOptions = {}
): UseRecipesResult {
  const { autoFetch = true, enableCache = true } = options;

  const [recipes, setRecipes] = useState<RecipeListResponse[]>([]);
  const [stats, setStats] = useState<RecipeStats>({ total: 0, bookmarked: 0 });
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isStale, setIsStale] = useState(false);

  // Simple cache for recipes
  const [cache, setCache] = useState<Map<string, { data: RecipeListResponse[], stats: RecipeStats, timestamp: number }>>(new Map());

  // Create cache key from query params
  const getCacheKey = useCallback((params: RecipeQueryParams) => {
    return JSON.stringify(params);
  }, []);

  const fetchRecipes = useCallback(async (forceRefresh = false) => {
    const cacheKey = getCacheKey(queryParams);

    // Check cache first (if enabled and not forcing refresh)
    if (enableCache && !forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        setRecipes(cached.data);
        setStats(cached.stats);
        const bookmarkedIds = cached.data
          .filter((recipe) => recipe.is_bookmarked)
          .map((recipe) => recipe.id);
        setBookmarks(bookmarkedIds);
        setLoading(false);
        setIsStale(false);
        return;
      } else if (cached) {
        setIsStale(true); // Data is stale but we'll show it while fetching fresh data
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch recipes (stats are now included in the response)
      const response = await recipesClient.getRecipesWithStats(queryParams);

      const recipesData = response.recipes || [];
      const statsData = {
        total: response.total || 0,
        bookmarked: response.bookmarked || 0
      };

      setRecipes(recipesData);
      setStats(statsData);
      setIsStale(false);

      // Extract bookmarked recipe IDs
      const bookmarkedIds = recipesData
        .filter((recipe) => recipe.is_bookmarked)
        .map((recipe) => recipe.id);
      setBookmarks(bookmarkedIds);

      // Cache the results
      if (enableCache) {
        setCache(prev => new Map(prev.set(cacheKey, {
          data: recipesData,
          stats: statsData,
          timestamp: Date.now()
        })));
      }
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      setError(err.message || 'Failed to fetch recipes');
      setIsStale(true); // Mark as stale on error
    } finally {
      setLoading(false);
    }
  }, [queryParams, enableCache, cache, getCacheKey]);

  useEffect(() => {
    if (autoFetch) {
      fetchRecipes();
    }
  }, [fetchRecipes, autoFetch]);

  return {
    recipes,
    stats,
    loading,
    error,
    bookmarks,
    refetch: () => fetchRecipes(true), // Force refresh
    isStale,
  };
}

/**
 * useRecipeProgress Hook
 * 
 * Hook for managing user progress on individual recipes.
 * Handles completion, rating, bookmarking, and time tracking.
 */
interface UseRecipeProgressResult {
  progress: {
    status: RecipeStatus | null;
    rating: number | null;
    notes: string | null;
    time_spent_minutes: number | null;
    completed_at: string | null;
  } | null;
  loading: boolean;
  error: string | null;
  markComplete: (rating?: number, notes?: string) => Promise<void>;
  updateRating: (rating: number) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  updateTimeSpent: (minutes: number) => Promise<void>;
  bookmark: () => Promise<void>;
  startRecipe: () => Promise<void>;
  unbookmark: () => Promise<void>;
  isBookmarked: boolean;
  refetch: () => Promise<void>;
}

export function useRecipeProgress(recipeSlug: string): UseRecipeProgressResult {
  const [progress, setProgress] = useState<UseRecipeProgressResult['progress']>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!recipeSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch recipe details (includes user progress and bookmark status)
      const recipe = await recipesClient.getRecipe(recipeSlug);
      
      if (recipe.user_progress) {
        setProgress({
          status: recipe.user_progress.status as RecipeStatus,
          rating: recipe.user_progress.rating || null,
          notes: recipe.user_progress.notes || null,
          time_spent_minutes: recipe.user_progress.time_spent_minutes || null,
          completed_at: recipe.user_progress.completed_at || null,
        });
      } else {
        setProgress(null);
      }
      
      setIsBookmarked(recipe.is_bookmarked || false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipe progress');
      console.error('Error fetching recipe progress:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeSlug]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const startRecipe = useCallback(async () => {
    try {
      await recipesClient.updateProgress(recipeSlug, {
        status: 'in_progress'
      });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to start recipe');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const markComplete = useCallback(async (rating?: number, notes?: string) => {
    try {
      await recipesClient.updateProgress(recipeSlug, {
        status: 'completed',
        ...(rating !== undefined ? { rating } : {}),
        ...(notes !== undefined ? { notes } : {}),
      });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to mark recipe as complete');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const updateRating = useCallback(async (rating: number) => {
    try {
      await recipesClient.updateProgress(recipeSlug, { rating });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to update rating');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const updateNotes = useCallback(async (notes: string) => {
    try {
      await recipesClient.updateProgress(recipeSlug, { notes });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to update notes');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const updateTimeSpent = useCallback(async (minutes: number) => {
    try {
      await recipesClient.updateProgress(recipeSlug, { time_spent_minutes: minutes });
      await fetchProgress();
    } catch (err: any) {
      setError(err.message || 'Failed to update time spent');
      throw err;
    }
  }, [recipeSlug, fetchProgress]);

  const bookmark = useCallback(async () => {
    try {
      await recipesClient.bookmarkRecipe(recipeSlug);
      setIsBookmarked(true);
    } catch (err: any) {
      setError(err.message || 'Failed to bookmark recipe');
      throw err;
    }
  }, [recipeSlug]);

  const unbookmark = useCallback(async () => {
    try {
      await recipesClient.unbookmarkRecipe(recipeSlug);
      setIsBookmarked(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unbookmark recipe');
      throw err;
    }
  }, [recipeSlug]);

  return {
    progress,
    loading,
    error,
    startRecipe,
    markComplete,
    updateRating,
    updateNotes,
    updateTimeSpent,
    bookmark,
    unbookmark,
    isBookmarked,
    refetch: fetchProgress,
  };
}

/**
 * useRecipeDetail Hook
 *
 * Hook for fetching individual recipe details.
 */
interface UseRecipeDetailResult {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecipeDetail(recipeId: string): UseRecipeDetailResult {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = useCallback(async () => {
    if (!recipeId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await recipesClient.getRecipe(recipeId);
      setRecipe(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipe details');
      console.error('Error fetching recipe details:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return {
    recipe,
    loading,
    error,
    refetch: fetchRecipe,
  };
}

/**
 * useUpdateRecipeProgress Hook
 *
 * Hook for updating recipe progress with optimistic updates and error recovery.
 */
interface UseUpdateRecipeProgressResult {
  updateProgress: (userId: string, recipeId: string, status: RecipeStatus) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useUpdateRecipeProgress(): UseUpdateRecipeProgressResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = useCallback(async (userId: string, recipeId: string, status: RecipeStatus) => {
    setLoading(true);
    setError(null);

    try {
      await recipesClient.updateRecipeProgress(recipeId, { status });
    } catch (err: any) {
      setError(err.message || 'Failed to update progress');
      console.error('Error updating recipe progress:', err);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateProgress,
    loading,
    error,
  };
}


