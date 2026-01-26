/**
 * Recipe Engine Client
 * Type-safe functions for Recipe API endpoints
 */

import { apiGateway } from './apiGateway';
import type {
  Recipe,
  RecipeListResponse,
  RecipeDetailResponse,
  UserRecipeProgress,
  RecipeContextLink,
  RecipeBookmark,
  RecipeProgressUpdate,
  RecipeStats,
  RecipeFilters,
} from './types/recipes';

// Re-export for convenience
export type { RecipeDetailResponse };

/**
 * Recipe Engine Client
 */
export const recipesClient = {
  /**
   * Get all recipes with stats and optional filters
   */
  async getRecipesWithStats(filters?: RecipeFilters): Promise<{ recipes: RecipeListResponse[], total: number, bookmarked?: number }> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.track) params.append('track', filters.track);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.max_time) params.append('max_time', filters.max_time.toString());
    if (filters?.context) params.append('context', filters.context);
    if (filters?.sort) params.append('sort', filters.sort);

    const queryString = params.toString();
    const path = `/recipes/${queryString ? `?${queryString}` : ''}`;

    const data = await apiGateway.get<any>(path);

    // Handle new Next.js API response format: { recipes: [...], total: ..., page: ..., page_size: ... }
    if (data?.recipes && Array.isArray(data.recipes)) {
      return {
        recipes: data.recipes,
        total: data.total || 0,
        bookmarked: data.bookmarked || 0
      };
    }

    // Handle paginated response (legacy Django format)
    if (data?.results && Array.isArray(data.results)) {
      return {
        recipes: data.results,
        total: data.count || 0,
        bookmarked: 0
      };
    }

    // Handle direct array response
    if (Array.isArray(data)) {
      return {
        recipes: data,
        total: data.length,
        bookmarked: 0
      };
    }

    return { recipes: [], total: 0, bookmarked: 0 };
  },

  /**
   * Get all recipes with optional filters (legacy method)
   */
  async getRecipes(filters?: RecipeFilters): Promise<RecipeListResponse[]> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.track) params.append('track', filters.track);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.max_time) params.append('max_time', filters.max_time.toString());
    if (filters?.context) params.append('context', filters.context);
    if (filters?.sort) params.append('sort', filters.sort);
    
    const queryString = params.toString();
    const path = `/recipes/${queryString ? `?${queryString}` : ''}`;
    
    const data = await apiGateway.get<any>(path);

    // Handle new Next.js API response format: { recipes: [...], total: ..., page: ..., page_size: ... }
    if (data?.recipes && Array.isArray(data.recipes)) {
      return data.recipes;
    }

    // Handle paginated response (legacy Django format)
    if (data?.results && Array.isArray(data.results)) {
      return data.results;
    }

    // Handle direct array response
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  },

  /**
   * Get recipe by slug
   */
  async getRecipe(slug: string): Promise<RecipeDetailResponse> {
    return apiGateway.get<RecipeDetailResponse>(`/recipes/${slug}/`);
  },

  /**
   * Get related recipes
   */
  async getRelatedRecipes(slug: string): Promise<Recipe[]> {
    return apiGateway.get<Recipe[]>(`/recipes/${slug}/related/`);
  },

  /**
   * Update user progress for a recipe
   */
  async updateProgress(
    slug: string,
    progress: RecipeProgressUpdate
  ): Promise<UserRecipeProgress> {
    const result = await apiGateway.post<UserRecipeProgress>(`/recipes/${slug}/progress/`, progress);

    // Also submit feedback if rating is provided (for self-improving loops)
    if (progress.rating && progress.rating > 0) {
      try {
        await apiGateway.post(`/recipes/${slug}/feedback/`, {
          rating: progress.rating,
          helpful_for: progress.helpful_for
        });
      } catch (error) {
        console.warn('Feedback submission failed, but progress was updated:', error);
      }
    }

    return result;
  },

  /**
   * Get user progress for a recipe
   */
  async getProgress(slug: string): Promise<UserRecipeProgress | null> {
    try {
      return await apiGateway.get<UserRecipeProgress>(`/recipes/${slug}/progress/`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Bookmark a recipe
   */
  async bookmarkRecipe(slug: string): Promise<RecipeBookmark> {
    return apiGateway.post<RecipeBookmark>(`/recipes/${slug}/bookmark/`);
  },

  /**
   * Unbookmark a recipe
   */
  async unbookmarkRecipe(slug: string): Promise<void> {
    return apiGateway.delete<void>(`/recipes/${slug}/bookmark/`);
  },

  /**
   * Get user's bookmarked recipes
   */
  async getBookmarks(): Promise<RecipeBookmark[]> {
    return apiGateway.get<RecipeBookmark[]>('/bookmarks/');
  },

  /**
   * Get user's recipe progress
   */
  async getMyProgress(): Promise<UserRecipeProgress[]> {
    const data = await apiGateway.get<any>('/my-progress/');
    
    if (data?.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  },

  /**
   * Get recipe context links (recipes for missions, modules, etc.)
   */
  async getContextLinks(
    contextType?: string,
    contextId?: string
  ): Promise<RecipeContextLink[]> {
    const params = new URLSearchParams();
    if (contextType) params.append('context_type', contextType);
    if (contextId) params.append('context_id', contextId);
    
    const queryString = params.toString();
    const path = `/context-links/${queryString ? `?${queryString}` : ''}`;
    
    const data = await apiGateway.get<any>(path);
    
    if (data?.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  },

  /**
   * Get recipe library statistics
   */
  async getStats(): Promise<RecipeStats> {
    return apiGateway.get<RecipeStats>('/stats/');
  },
};

export default recipesClient;

