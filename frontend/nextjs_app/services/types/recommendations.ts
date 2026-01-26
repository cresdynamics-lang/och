/**
 * Recommendation types matching FastAPI Pydantic models
 * These types should stay in sync with backend/fastapi_app/schemas/recommendations.py
 */

export interface RecommendationItem {
  content_id: string;
  content_type: string;
  title: string;
  description?: string;
  score: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationRequest {
  user_id: number;
  content_type?: string;
  limit?: number;
  filters?: Record<string, any>;
}

export interface RecommendationResponse {
  user_id: number;
  recommendations: RecommendationItem[];
  total: number;
  model_version?: string;
}

export interface PersonalityTrait {
  name: string;
  score: number;
  description?: string;
}

export interface PersonalityAnalysisRequest {
  user_id: number;
  progress_data?: any[];
}

export interface PersonalityAnalysisResponse {
  user_id: number;
  traits: PersonalityTrait[];
  summary?: string;
  recommendations?: string[];
  analyzed_at: string;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: Array<{
    text: string;
    embedding: number[];
  }>;
  model: string;
  dimension: number;
}

export interface StoreEmbeddingRequest {
  texts: string[];
  content_type: string;
  content_id: string;
  metadata?: Record<string, any>;
}

export interface StoreEmbeddingResponse {
  status: string;
  stored_count: number;
  ids: string[];
}

