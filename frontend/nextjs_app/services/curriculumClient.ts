/**
 * Curriculum Engine Client
 * Type-safe functions for Curriculum API endpoints
 */

import { apiGateway } from './apiGateway'
import type {
  CurriculumTrack,
  CurriculumTrackDetail,
  CurriculumModuleList,
  CurriculumModuleDetail,
  Lesson,
  UserTrackProgress,
  ModuleProgress,
  LessonProgress,
  TrackEnrollResponse,
  MyProgressResponse,
} from './types/curriculum'

export interface Tier2Status {
  track_code: string
  track_name: string
  completion_percentage: number
  is_complete: boolean
  tier2_completion_requirements_met: boolean
  requirements: {
    mandatory_modules_total: number
    mandatory_modules_completed: number
    quizzes_total: number
    quizzes_passed: number
    mini_missions_total: number
    mini_missions_completed: number
    reflections_submitted: number
    mentor_approval: boolean
  }
  missing_requirements: string[]
  can_progress_to_tier3: boolean
}

export const curriculumClient = {
  /**
   * Get all curriculum tracks
   * GET /curriculum/tracks/
   */
  async getTracks(params?: { tier?: number; level?: string }): Promise<CurriculumTrack[]> {
    const queryParams = new URLSearchParams()
    if (params?.tier) queryParams.append('tier', params.tier.toString())
    if (params?.level) queryParams.append('level', params.level)
    
    const queryString = queryParams.toString()
    return apiGateway.get(`/curriculum/tracks/${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get track details with modules
   * GET /curriculum/tracks/{code}/
   */
  async getTrack(code: string): Promise<CurriculumTrackDetail> {
    return apiGateway.get(`/curriculum/tracks/${code}/`)
  },

  /**
   * Enroll in a track
   * POST /curriculum/tracks/{code}/enroll/
   */
  async enrollInTrack(code: string): Promise<TrackEnrollResponse> {
    return apiGateway.post(`/curriculum/tracks/${code}/enroll/`)
  },

  /**
   * Get user's progress in a track
   * GET /curriculum/tracks/{code}/progress/
   */
  async getTrackProgress(code: string): Promise<UserTrackProgress> {
    return apiGateway.get(`/curriculum/tracks/${code}/progress/`)
  },

  /**
   * Get user's overall curriculum progress
   * GET /curriculum/my-progress/
   */
  async getMyProgress(): Promise<MyProgressResponse> {
    return apiGateway.get('/curriculum/my-progress/')
  },

  /**
   * Get module details
   * GET /curriculum/modules/{id}/
   */
  async getModule(moduleId: string): Promise<CurriculumModuleDetail> {
    return apiGateway.get(`/curriculum/modules/${moduleId}/`)
  },

  /**
   * Start a module
   * POST /curriculum/modules/{id}/start/
   */
  async startModule(moduleId: string): Promise<{ status: string; progress: ModuleProgress }> {
    return apiGateway.post(`/curriculum/modules/${moduleId}/start/`)
  },

  /**
   * Complete a module
   * POST /curriculum/modules/{id}/complete/
   */
  async completeModule(moduleId: string): Promise<{ status: string; progress: ModuleProgress }> {
    return apiGateway.post(`/curriculum/modules/${moduleId}/complete/`)
  },

  /**
   * Get lesson details
   * GET /curriculum/lessons/{id}/
   */
  async getLesson(lessonId: string): Promise<Lesson> {
    return apiGateway.get(`/curriculum/lessons/${lessonId}/`)
  },

  /**
   * Update lesson progress
   * POST /curriculum/lessons/{id}/progress/
   */
  async updateLessonProgress(
    lessonId: string,
    data: {
      status?: 'not_started' | 'in_progress' | 'completed'
      progress_percentage?: number
      time_spent_minutes?: number
      quiz_score?: number
    }
  ): Promise<{ status: string; progress: LessonProgress }> {
    return apiGateway.post(`/curriculum/lessons/${lessonId}/progress/`, data)
  },

  /**
   * Tier 2 (Beginner Tracks) specific endpoints
   */

  /**
   * Get Tier 2 track completion status
   * GET /curriculum/tier2/tracks/{code}/status
   */
  async getTier2Status(trackCode: string): Promise<Tier2Status> {
    return apiGateway.get(`/curriculum/tier2/tracks/${trackCode}/status`)
  },

  /**
   * Submit quiz result for Tier 2
   * POST /curriculum/tier2/tracks/{code}/submit-quiz
   */
  async submitTier2Quiz(
    trackCode: string,
    data: {
      lesson_id: string
      score: number
      answers: Record<string, any>
    }
  ): Promise<{
    success: boolean
    quiz_passed: boolean
    score: number
    tier2_quizzes_passed: number
    is_complete: boolean
    missing_requirements: string[]
  }> {
    return apiGateway.post(`/curriculum/tier2/tracks/${trackCode}/submit-quiz`, data)
  },

  /**
   * Submit reflection for Tier 2
   * POST /curriculum/tier2/tracks/{code}/submit-reflection
   */
  async submitTier2Reflection(
    trackCode: string,
    data: {
      module_id: string
      reflection_text: string
    }
  ): Promise<{
    success: boolean
    reflections_submitted: number
    is_complete: boolean
    missing_requirements: string[]
  }> {
    return apiGateway.post(`/curriculum/tier2/tracks/${trackCode}/submit-reflection`, data)
  },

  /**
   * Submit mini-mission for Tier 2
   * POST /curriculum/tier2/tracks/{code}/submit-mini-mission
   */
  async submitTier2MiniMission(
    trackCode: string,
    data: {
      module_mission_id: string
      submission_data: Record<string, any>
    }
  ): Promise<{
    success: boolean
    mini_missions_completed: number
    is_complete: boolean
    missing_requirements: string[]
  }> {
    return apiGateway.post(`/curriculum/tier2/tracks/${trackCode}/submit-mini-mission`, data)
  },

  /**
   * Complete Tier 2 and unlock Tier 3
   * POST /curriculum/tier2/tracks/{code}/complete
   */
  async completeTier2(trackCode: string): Promise<{
    success: boolean
    message: string
    completed_at: string
    tier3_unlocked: boolean
  }> {
    return apiGateway.post(`/curriculum/tier2/tracks/${trackCode}/complete`)
  },

  // ==================== TIER 6 - CROSS-TRACK PROGRAMS ====================

  /**
   * Get all cross-track programs
   * GET /curriculum/cross-track/
   */
  async getCrossTrackPrograms(): Promise<{
    programs: Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      icon: string;
      color: string;
      module_count: number;
      lesson_count: number;
      progress: {
        completion_percentage: number;
        modules_completed: number;
        lessons_completed: number;
        submissions_completed: number;
        is_complete: boolean;
      } | null;
    }>;
    total: number;
  }> {
    return apiGateway.get('/curriculum/cross-track/')
  },

  /**
   * Get cross-track program details
   * GET /curriculum/cross-track/{code}/
   */
  async getCrossTrackProgram(code: string): Promise<{
    program: CurriculumTrackDetail;
    modules: Array<{
      id: string;
      title: string;
      description: string;
      order_index: number;
      estimated_time_minutes: number;
      lesson_count: number;
      lessons: Array<{
        id: string;
        title: string;
        description: string;
        lesson_type: string;
        content_url: string;
        duration_minutes: number;
        order_index: number;
      }>;
    }>;
    progress: {
      completion_percentage: number;
      modules_completed: number;
      lessons_completed: number;
      submissions_completed: number;
      is_complete: boolean;
    };
  }> {
    return apiGateway.get(`/curriculum/cross-track/${code}/`)
  },

  /**
   * Submit cross-track assignment (reflection, scenario, document, quiz)
   * POST /curriculum/cross-track/submit/
   */
  async submitCrossTrack(data: {
    track_id: string;
    module_id?: string;
    lesson_id?: string;
    submission_type: 'reflection' | 'scenario' | 'document' | 'portfolio' | 'quiz';
    content?: string;
    document_url?: string;
    document_filename?: string;
    scenario_choice?: string;
    scenario_reasoning?: string;
    scenario_metadata?: Record<string, any>;
    quiz_answers?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    submission: any;
    message: string;
  }> {
    return apiGateway.post('/curriculum/cross-track/submit/', data)
  },

  /**
   * Get cross-track progress overview
   * GET /curriculum/cross-track/progress/
   */
  async getCrossTrackProgress(): Promise<{
    total_programs: number;
    programs_completed: number;
    completion_percentage: number;
    programs: Array<{
      completion_percentage: number;
      modules_completed: number;
      lessons_completed: number;
      submissions_completed: number;
      is_complete: boolean;
    }>;
    marketplace_ready: boolean;
  }> {
    return apiGateway.get('/curriculum/cross-track/progress/')
  },
}
