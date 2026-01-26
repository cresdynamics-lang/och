/**
 * Progress types matching Django DRF ProgressSerializer
 * These types should stay in sync with backend/django_app/progress/serializers.py
 */

export interface Progress {
  id: number;
  user: number;
  content_id: string;
  content_type: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  completion_percentage: number;
  score?: number;
  started_at?: string;
  completed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateProgressRequest {
  content_id: string;
  content_type: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
  completion_percentage?: number;
  metadata?: Record<string, any>;
}

export interface UpdateProgressRequest {
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
  completion_percentage?: number;
  score?: number;
  metadata?: Record<string, any>;
}

