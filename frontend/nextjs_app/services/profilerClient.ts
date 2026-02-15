/**
 * Profiler Client
 * Client for accessing profiler/Future-You data
 */

import { apiGateway } from './apiGateway'
import type { FutureYou } from './types/profiler'

export const profilerClient = {
  /**
   * Get Future-You persona and track recommendation for a mentee
   * GET /api/v1/profiler/mentees/{mentee_id}/future-you
   */
  async getFutureYou(menteeId: string): Promise<FutureYou> {
    return apiGateway.get(`/profiler/mentees/${menteeId}/future-you`)
  },

  /**
   * Get profiler status for a user
   * GET /api/v1/profiler/status
   */
  async getStatus(userId?: string): Promise<{
    status: string
    current_section?: string
    progress?: number
  }> {
    const url = userId ? `/profiler/status?user_id=${userId}` : '/profiler/status'
    return apiGateway.get(url)
  },

  /**
   * Start profiler session
   * POST /api/v1/profiler/start
   */
  async startSession(): Promise<{ session_id: string }> {
    return apiGateway.post('/profiler/start', {})
  },

  /**
   * Get profiler results
   * GET /api/v1/profiler/results
   */
  async getResults(userId?: string): Promise<FutureYou> {
    const url = userId ? `/profiler/results?user_id=${userId}` : '/profiler/results'
    return apiGateway.get(url)
  },

  /**
   * Get Future You insights with AI-generated career analysis
   * GET /api/v1/profiler/future-you/insights
   */
  async getFutureYouInsights(): Promise<any> {
    return apiGateway.get('/profiler/future-you/insights')
  },

  /**
   * Get comprehensive profiler results for a mentee (mentor/coaching OS access)
   * GET /api/v1/profiler/mentees/{menteeId}/results
   */
  async getMenteeResults(menteeId: string): Promise<{
    mentee_id: number
    mentee_email: string
    mentee_name: string
    session_id: string
    completed_at: string | null
    is_locked: boolean
    scores: {
      overall: number | null
      aptitude: number | null
      behavioral: number | null
    }
    recommended_track: {
      track_id: string | null
      confidence: number | null
    }
    strengths: string[]
    areas_for_growth: string[]
    behavioral_profile: Record<string, any>
    future_you_persona: Record<string, any>
    aptitude_breakdown: Record<string, any>
    recommended_tracks: any[]
    learning_path_suggestions: any[]
    och_mapping: Record<string, any>
    enhanced_results?: any
    anti_cheat?: {
      score: number | null
      suspicious_patterns: string[]
      device_fingerprint: string | null
    }
  }> {
    return apiGateway.get(`/profiler/mentees/${menteeId}/results`)
  },
}

