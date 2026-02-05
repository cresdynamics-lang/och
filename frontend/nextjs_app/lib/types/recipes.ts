/**
 * Recipe Types
 * Type definitions for recipes
 */

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
