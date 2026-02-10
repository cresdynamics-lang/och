/**
 * Capstone Project Service Client
 * Handles Capstone Project CRUD and phase completion
 */

import { apiGateway } from './apiGateway'

export interface CapstoneProject {
  id: string
  mission_id: string
  mission_title: string
  track: 'defender' | 'offensive' | 'grc' | 'innovation' | 'leadership'
  status: 'not_started' | 'investigation' | 'decision_making' | 'design_remediation' | 'reporting' | 'presentation' | 'submitted' | 'under_review' | 'approved' | 'revision_requested' | 'failed'
  current_phase: string
  investigation: {
    findings: Record<string, any>
    artifacts: Array<{ type: string; url: string; description: string }>
    completed_at: string | null
  }
  decision_making: {
    decisions: Array<{ decision_id: string; choice_id: string; rationale: string; timestamp: string }>
    analysis: string
    completed_at: string | null
  }
  design_remediation: {
    documents: Array<{ type: string; url: string; description: string }>
    remediation_plan: string
    completed_at: string | null
  }
  reporting: {
    report_url: string | null
    summary: string
    key_findings: Array<{ finding: string; impact: string; recommendation: string }>
    completed_at: string | null
  }
  presentation: {
    presentation_url: string | null
    presentation_type: 'video' | 'slides' | 'document' | 'interactive' | null
    notes: string
    completed_at: string | null
  }
  mentor_review: {
    phases: Array<{ phase: string; feedback: string; score: number | null; reviewed_at: string }>
    audio_feedback_url: string | null
    video_feedback_url: string | null
    final_score: number | null
    approved: boolean
    reviewed_at: string | null
  }
  started_at: string | null
  submitted_at: string | null
  completed_at: string | null
}

export interface CapstoneProjectListItem {
  id: string
  mission_id: string
  mission_title: string
  track: string
  status: string
  current_phase: string
  mentor_approved: boolean
  created_at: string
}

export const capstoneClient = {
  /**
   * Create a new capstone project
   */
  async createCapstoneProject(missionId: string): Promise<CapstoneProject> {
    return apiGateway.post('/capstone-projects/create/', { mission_id: missionId })
  },

  /**
   * Get capstone project details
   */
  async getCapstoneProject(capstoneId: string): Promise<CapstoneProject> {
    return apiGateway.get(`/capstone-projects/${capstoneId}/`)
  },

  /**
   * Update capstone project data
   */
  async updateCapstoneProject(capstoneId: string, data: Partial<CapstoneProject>): Promise<CapstoneProject> {
    return apiGateway.put(`/capstone-projects/${capstoneId}/update/`, data)
  },

  /**
   * Complete a capstone phase
   */
  async completePhase(capstoneId: string, phase: 'investigation' | 'decision_making' | 'design_remediation' | 'reporting' | 'presentation'): Promise<CapstoneProject> {
    return apiGateway.post(`/capstone-projects/${capstoneId}/complete-phase/${phase}/`)
  },

  /**
   * Submit capstone project for mentor review
   */
  async submitCapstoneProject(capstoneId: string): Promise<CapstoneProject> {
    return apiGateway.post(`/capstone-projects/${capstoneId}/submit/`)
  },

  /**
   * List user's capstone projects
   */
  async listCapstoneProjects(params?: {
    track?: string
    status?: string
  }): Promise<{ results: CapstoneProjectListItem[] }> {
    return apiGateway.get('/capstone-projects/', { params })
  },
}
