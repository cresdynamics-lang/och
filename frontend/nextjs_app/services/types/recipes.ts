/**
 * Recipe Engine TypeScript types
 */

export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type RecipeStatus = 'started' | 'completed' | 'bookmarked';

export interface RecipeContentSection {
  type: 'intro' | 'prerequisites' | 'steps' | 'validation';
  title: string;
  content?: string;
  items?: string[];
  steps?: RecipeStep[];
}

export interface RecipeStep {
  step: number;
  title: string;
  commands?: string[];
  code?: string;
  explanation: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  difficulty: RecipeDifficulty;
  estimated_minutes: number;
  track_codes: string[];
  skill_codes: string[];
  tools_used: string[];
  prerequisites?: string[];
  content: {
    sections: RecipeContentSection[];
  };
  validation_steps?: Record<string, string>;
  thumbnail_url?: string;
  mentor_curated: boolean;
  usage_count: number;
  avg_rating: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // User-specific fields (when fetched with user context)
  is_bookmarked?: boolean;
  user_status?: RecipeStatus;
  user_rating?: number;
}

export interface RecipeListResponse extends Recipe {
  is_bookmarked: boolean;
  user_status: RecipeStatus | null;
  user_rating: number | null;
  context_labels?: string[]; // e.g., ["Used in Mission", "Used in Module"]
}

export interface UserRecipeProgress {
  id: string;
  recipe: string;
  recipe_title: string;
  recipe_slug: string;
  status: RecipeStatus;
  rating?: number;
  notes?: string;
  time_spent_minutes?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeContextLink {
  id: string;
  recipe: string;
  recipe_title: string;
  recipe_slug: string;
  recipe_summary: string;
  recipe_difficulty: RecipeDifficulty;
  recipe_estimated_minutes: number;
  context_type: 'mission' | 'module' | 'project' | 'mentor_session';
  context_id: string;
  is_required: boolean;
  position_order: number;
}

export interface RecipeBookmark {
  id: string;
  recipe: Recipe;
  bookmarked_at: string;
}

export interface RecipeProgressUpdate {
  status?: RecipeStatus;
  rating?: number | null;
  helpful_for?: string[];
  notes?: string;
  time_spent_minutes?: number | null;
}

export interface RecipeStats {
  total: number;
  bookmarked: number;
}

export interface RecipeFilters {
  search?: string;
  track?: string;
  difficulty?: RecipeDifficulty;
  max_time?: number;
  context?: 'mission' | 'module' | 'project' | 'mentor_session';
  sort?: 'relevance' | 'popular' | 'recent' | 'rating';
}

export interface RecipeDetailResponse extends Recipe {
  is_bookmarked: boolean;
  user_progress?: {
    status: string;
    rating?: number;
    notes?: string;
    time_spent_minutes?: number;
    completed_at?: string;
  };
  related_recipes: Recipe[];
}


