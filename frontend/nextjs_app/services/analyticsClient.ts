/**
 * Analytics Service Client
 * Handles skill analytics, readiness scores, and behavioral trends
 */

import { apiGateway } from './apiGateway'
import type {
  ReadinessScore,
  SkillHeatmapData,
  SkillMastery,
  BehavioralTrend,
  AnalyticsFilter,
} from './types/analytics'

export const analyticsClient = {
  /**
   * Get readiness scores over time
   */
  async getReadinessOverTime(menteeId: string, filter?: AnalyticsFilter): Promise<ReadinessScore[]> {
    return apiGateway.get(`/talentscope/mentees/${menteeId}/readiness-over-time`, { params: filter })
  },

  /**
   * Get skills heatmap data
   */
  async getSkillsHeatmap(menteeId: string, filter?: AnalyticsFilter): Promise<SkillHeatmapData[]> {
    return apiGateway.get(`/talentscope/mentees/${menteeId}/skills-heatmap`, { params: filter })
  },

  /**
   * Get skill mastery by category
   */
  async getSkillMastery(menteeId: string, category?: string): Promise<SkillMastery[]> {
    return apiGateway.get(`/talentscope/mentees/${menteeId}/skills`, {
      params: category ? { category } : {},
    })
  },

  /**
   * Get behavioral trends
   */
  async getBehavioralTrends(menteeId: string, filter?: AnalyticsFilter): Promise<BehavioralTrend[]> {
    return apiGateway.get(`/talentscope/mentees/${menteeId}/behavioral-trends`, { params: filter })
  },

  /**
   * Export analytics report
   */
  async exportReport(menteeId: string, format: 'pdf' | 'csv', filter?: AnalyticsFilter): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/api/v1/talentscope/mentees/${menteeId}/export?format=${format}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    )
    return response.blob()
  },
}

