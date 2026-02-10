/**
 * Mentorship Interaction Service Client
 * Handles mentorship interactions including multi-phase reviews, audio/video feedback, and scoring meetings
 */

import { apiGateway } from './apiGateway'

export interface MentorshipInteraction {
  id: string
  mentor_id: string
  mentor_name: string
  mentee_id: string
  mentee_name: string
  mission_id: string | null
  capstone_project_id: string | null
  interaction_type: 'mission_review' | 'capstone_review' | 'subtask_review' | 'decision_review' | 'scoring_meeting' | 'feedback_session' | 'progress_check'
  phase: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  review_phase: number
  total_phases: number
  is_multi_phase: boolean
  written_feedback: string
  feedback_per_subtask: Record<string, string>
  feedback_per_decision: Record<string, string>
  audio_feedback_url: string | null
  video_feedback_url: string | null
  audio_duration_seconds: number | null
  video_duration_seconds: number | null
  rubric_scores: Record<string, number>
  subtask_scores: Record<string, number>
  overall_score: number | null
  is_scoring_meeting: boolean
  meeting_notes: string
  meeting_duration_minutes: number | null
  recommended_next_steps: Array<{ action: string; priority: string; deadline: string }>
  recommended_recipes: string[]
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface MentorshipInteractionListItem {
  id: string
  mentor_id: string
  mentor_name: string
  mentee_id: string
  mentee_name: string
  mission_id: string | null
  capstone_project_id: string | null
  interaction_type: string
  phase: string | null
  status: string
  review_phase: number
  total_phases: number
  overall_score: number | null
  has_audio_feedback: boolean
  has_video_feedback: boolean
  is_scoring_meeting: boolean
  created_at: string
  completed_at: string | null
}

export const mentorshipInteractionClient = {
  /**
   * Create a new mentorship interaction
   */
  async createInteraction(data: {
    mentee_id: string
    mission_id?: string
    capstone_project_id?: string
    interaction_type: string
    phase?: string
    review_phase?: number
    total_phases?: number
    scheduled_at?: string
  }): Promise<MentorshipInteraction> {
    return apiGateway.post('/mentorship-interactions/create/', data)
  },

  /**
   * Get mentorship interaction details
   */
  async getInteraction(interactionId: string): Promise<MentorshipInteraction> {
    return apiGateway.get(`/mentorship-interactions/${interactionId}/`)
  },

  /**
   * Update mentorship interaction
   */
  async updateInteraction(interactionId: string, data: Partial<MentorshipInteraction>): Promise<MentorshipInteraction> {
    return apiGateway.put(`/mentorship-interactions/${interactionId}/update/`, data)
  },

  /**
   * Complete a review phase in a multi-phase review
   */
  async completeReviewPhase(interactionId: string): Promise<MentorshipInteraction> {
    return apiGateway.post(`/mentorship-interactions/${interactionId}/complete-phase/`)
  },

  /**
   * Upload audio or video feedback
   */
  async uploadFeedbackMedia(interactionId: string, data: {
    media_type: 'audio' | 'video'
    file_url: string
    duration_seconds?: number
  }): Promise<MentorshipInteraction> {
    return apiGateway.post(`/mentorship-interactions/${interactionId}/upload-feedback/`, data)
  },

  /**
   * List mentorship interactions
   */
  async listInteractions(params?: {
    role?: 'mentor' | 'mentee'
    mission_id?: string
    capstone_project_id?: string
    interaction_type?: string
    status?: string
  }): Promise<{ results: MentorshipInteractionListItem[] }> {
    return apiGateway.get('/mentorship-interactions/', { params })
  },
}
