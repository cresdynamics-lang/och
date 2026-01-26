/**
 * Missions Service Client
 * Handles mission-related endpoints
 */

import { apiGateway } from './apiGateway'
import type { Mission, RecommendedMission } from './types/missions'

export interface MissionTemplate {
  id?: string
  code: string
  title: string
  description?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'capstone'
  type: 'lab' | 'scenario' | 'project' | 'capstone'
  track_id?: string
  track_key?: string
  track_name?: string | null
  program_id?: string | null
  program_name?: string | null
  est_hours?: number
  estimated_time_minutes?: number
  competencies?: string[]
  requirements?: Record<string, any>
  created_at?: string
  // OCH Admin fields (stored in requirements JSON for now)
  status?: 'draft' | 'approved' | 'published' | 'retired'
  assessment_mode?: 'auto' | 'manual' | 'hybrid'
  requires_mentor_review?: boolean
  story_narrative?: string
  subtasks?: Array<{
    id: string
    title: string
    description?: string
    order: number
    required: boolean
    dependencies?: string[] // IDs of subtasks that must be completed first
  }>
  evidence_upload_schema?: {
    file_types?: string[]
    max_file_size_mb?: number
    required_artifacts?: Array<{
      type: 'file' | 'github' | 'notebook' | 'video' | 'screenshot'
      required: boolean
      description?: string
    }>
  }
  time_constraint_hours?: number // For time-bound missions (24 hours to 7 days)
  competency_coverage?: Array<{
    competency_id: string
    competency_name: string
    weight_percentage: number // Must sum to 100
  }>
  rubric_id?: string
  module_id?: string
}

export const missionsClient = {
  /**
   * Get all missions (for directors/admin)
   */
  async getAllMissions(params?: {
    program_id?: string
    track_id?: string
    track_key?: string
    difficulty?: string
    type?: string
    search?: string
    status?: string
    page?: number
    page_size?: number
  }): Promise<{ results: MissionTemplate[]; count: number; next?: string | null; previous?: string | null }> {
    try {
      console.log('📡 Fetching missions from /api/v1/student/missions/', params)
      const data = await apiGateway.get<any>('/student/missions/', { params })
      console.log('📡 Missions API Response:', {
        type: typeof data,
        isArray: Array.isArray(data),
        hasResults: data?.results !== undefined,
        hasCount: data?.count !== undefined,
        hasTotal: data?.total !== undefined,
        resultsCount: Array.isArray(data?.results) ? data.results.length : data?.results?.length || 0,
        count: data?.count || data?.total || 0,
        page: data?.page,
        hasNext: data?.next,
        hasPrevious: data?.previous,
      })
      
      // Handle paginated response (DRF default pagination)
      if (data?.results !== undefined) {
        const missions = Array.isArray(data.results) ? data.results : []
        const totalCount = data.count !== undefined ? data.count : (data.total !== undefined ? data.total : missions.length)
        
        console.log(`✅ Found ${missions.length} missions in paginated response (total: ${totalCount})`)
        if (missions.length > 0) {
          console.log('Sample mission:', {
            id: missions[0].id,
            code: missions[0].code,
            title: missions[0].title,
            difficulty: missions[0].difficulty,
            type: missions[0].type,
            track_id: missions[0].track_id,
            track_key: missions[0].track_key,
          })
        }
        
        return {
          results: missions,
          count: totalCount,
          next: data.next || null,
          previous: data.previous || null,
        }
      }
      
      // Handle direct array response (fallback)
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} missions in direct array response`)
        return {
          results: data,
          count: data.length,
          next: null,
          previous: null,
        }
      }
      
      console.warn('⚠️ Unexpected missions response format:', data)
      return {
        results: [],
        count: 0,
        next: null,
        previous: null,
      }
    } catch (error) {
      console.error('❌ Failed to fetch missions:', error)
      throw error
    }
  },

  /**
   * Get mission by ID
   */
  async getMission(id: string): Promise<MissionTemplate> {
    return apiGateway.get(`/missions/${id}/`)
  },

  /**
   * Create mission
   */
  async createMission(data: Partial<MissionTemplate>): Promise<MissionTemplate> {
    return apiGateway.post('/missions/', data)
  },

  /**
   * Update mission
   */
  async updateMission(id: string, data: Partial<MissionTemplate>): Promise<MissionTemplate> {
    return apiGateway.patch(`/missions/${id}/`, data)
  },

  /**
   * Delete mission
   */
  async deleteMission(id: string): Promise<void> {
    return apiGateway.delete(`/missions/${id}/`)
  },

  /**
   * Get mission submissions (for analytics)
   */
  async getMissionSubmissions(missionId: string): Promise<{ submissions: any[]; count: number }> {
    return apiGateway.get(`/missions/${missionId}/submissions/`)
  },

  /**
   * Get in-progress missions
   */
  async getInProgressMissions(menteeId: string): Promise<Mission[]> {
    return apiGateway.get(`/missions/mentees/${menteeId}/in-progress`)
  },

  /**
   * Get next recommended mission
   */
  async getNextRecommended(menteeId: string): Promise<RecommendedMission | null> {
    return apiGateway.get(`/missions/mentees/${menteeId}/next-recommended`)
  },

  /**
   * Start mission
   */
  async startMission(menteeId: string, missionId: string): Promise<Mission> {
    return apiGateway.post(`/missions/mentees/${menteeId}/missions/${missionId}/start`, {})
  },
}
