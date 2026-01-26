/**
 * Foundations Client
 * Client for Tier 1 Foundations API endpoints
 */

import { apiGateway } from './apiGateway'

export interface FoundationsModule {
  id: string
  title: string
  description: string
  module_type: 'video' | 'interactive' | 'assessment' | 'reflection'
  video_url?: string
  diagram_url?: string
  content?: string
  order: number
  is_mandatory: boolean
  estimated_minutes: number
  completed: boolean
  watch_percentage: number
  completed_at?: string
}

export interface FoundationsStatus {
  foundations_available: boolean
  status: 'not_started' | 'in_progress' | 'completed'
  completion_percentage: number
  is_complete: boolean
  modules: FoundationsModule[]
  assessment_score?: number
  goals_reflection?: string
  confirmed_track_key?: string
  started_at?: string
  completed_at?: string
}

export const foundationsClient = {
  /**
   * Get Foundations status and progress
   * GET /api/v1/foundations/status
   */
  async getStatus(): Promise<FoundationsStatus> {
    return apiGateway.get('/foundations/status')
  },

  /**
   * Complete a Foundations module
   * POST /api/v1/foundations/modules/{module_id}/complete
   */
  async completeModule(moduleId: string, watchPercentage?: number): Promise<{
    success: boolean
    completion_percentage: number
    is_complete: boolean
    status: string
  }> {
    return apiGateway.post(`/foundations/modules/${moduleId}/complete`, {
      watch_percentage: watchPercentage || 100
    })
  },

  /**
   * Update module progress (e.g., video watch percentage)
   * POST /api/v1/foundations/modules/{module_id}/progress
   */
  async updateModuleProgress(moduleId: string, watchPercentage: number): Promise<{
    success: boolean
    watch_percentage: number
  }> {
    return apiGateway.post(`/foundations/modules/${moduleId}/progress`, {
      watch_percentage: watchPercentage
    })
  },

  /**
   * Get Foundations assessment questions
   * GET /api/v1/foundations/assessment/questions
   */
  async getAssessmentQuestions(): Promise<{
    questions: Array<{
      id: string
      question: string
      options: Array<{ value: string; text: string }>
    }>
    total_questions: number
  }> {
    return apiGateway.get('/foundations/assessment/questions')
  },

  /**
   * Submit Foundations assessment
   * POST /api/v1/foundations/assessment
   * Score is calculated automatically from answers
   */
  async submitAssessment(answers: Record<string, string>): Promise<{
    success: boolean
    score: number
    total_questions: number
    correct_answers: number
    detailed_results: Record<string, {
      correct: boolean
      selected: string
      correct_answer: string
      explanation: string
    }>
    completion_percentage: number
    is_complete: boolean
    missing_requirements?: string[]
  }> {
    return apiGateway.post('/foundations/assessment', {
      answers
    })
  },

  /**
   * Submit goals reflection
   * POST /api/v1/foundations/reflection
   */
  async submitReflection(goalsReflection: string, valueStatement?: string): Promise<{
    success: boolean
    completion_percentage: number
    is_complete: boolean
  }> {
    return apiGateway.post('/foundations/reflection', {
      goals_reflection: goalsReflection,
      value_statement: valueStatement
    })
  },

  /**
   * Confirm or override track selection
   * POST /api/v1/foundations/confirm-track
   */
  async confirmTrack(trackKey: string, isOverride: boolean = false): Promise<{
    success: boolean
    confirmed_track_key: string
    is_override: boolean
  }> {
    return apiGateway.post('/foundations/confirm-track', {
      track_key: trackKey,
      is_override: isOverride
    })
  },

  /**
   * Complete Foundations and transition to Tier 2
   * POST /api/v1/foundations/complete
   */
  async completeFoundations(): Promise<{
    success: boolean
    message: string
    confirmed_track_key: string
    transitioned_at: string
  }> {
    return apiGateway.post('/foundations/complete', {})
  },
}
