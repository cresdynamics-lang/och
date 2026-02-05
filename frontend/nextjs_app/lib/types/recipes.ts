/**
 * Recipe Types
 * Type definitions for recipes
 */

import { z } from 'zod'

export interface Recipe {
  id?: number
  title: string
  description?: string
  difficulty?: string
  estimated_time?: number
  tags?: string[]
  steps?: string[]
  [key: string]: any
}

export interface RecipeSource {
  id: number
  url?: string
  source_type: string
  raw_content?: string
  [key: string]: any
}

// Zod Schemas for validation
export const ProgressUpdateRequestSchema = z.object({
  progress_percentage: z.number().min(0).max(100),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  notes: z.string().optional(),
  completed_at: z.string().optional(),
})

export const UserRecipesResponseSchema = z.object({
  recipes: z.array(z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().optional(),
    difficulty: z.string().optional(),
    estimated_time: z.number().optional(),
    tags: z.array(z.string()).optional(),
    progress_percentage: z.number().optional(),
    status: z.string().optional(),
  })),
  total: z.number(),
})
