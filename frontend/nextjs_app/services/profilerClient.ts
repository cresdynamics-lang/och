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
}

