/**
 * Talentscope Service Client
 * Handles readiness and progress endpoints
 */

import { apiGateway } from './apiGateway'
import type { TalentscopeOverview } from './types/talentscope'

export const talentscopeClient = {
  /**
   * Get overview for a mentee
   */
  async getOverview(menteeId: string): Promise<TalentscopeOverview> {
    return apiGateway.get(`/talentscope/mentees/${menteeId}/overview`)
  },
}
