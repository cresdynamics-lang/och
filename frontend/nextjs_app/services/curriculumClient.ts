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
    /** Minimum mini-missions required to complete (1 or 2, from track config) */
    mini_missions_required?: number
    reflections_submitted: number
    mentor_approval: boolean
    /** Whether this track requires mentor approval to complete (from track config) */
    mentor_approval_required?: boolean
  }
  missing_requirements: string[]
  can_progress_to_tier3: boolean
  /** sequential = unlock in order; flexible = all modules available */
  progression_mode?: 'sequential' | 'flexible'
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
   * Beginner Tracks specific endpoints
   */

  /**
   * Get Beginner level track completion status
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
   * Complete Beginner level and unlock Intermediate level
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

  /**
   * Get Tier 2 mentor feedback (learner: my feedback; mentor: feedback I gave)
   * GET /curriculum/tier2/tracks/{code}/feedback
   */
  async getTier2Feedback(trackCode: string): Promise<{ feedback: Array<{
    id: number
    comment_text: string
    lesson_id: string | null
    lesson_title: string | null
    module_id: string | null
    module_title: string | null
    mentor_email?: string
    learner_email?: string
    created_at: string
  }> }> {
    return apiGateway.get(`/curriculum/tier2/tracks/${trackCode}/feedback`)
  },

  /**
   * Mentor: add feedback for a learner
   * POST /curriculum/tier2/tracks/{code}/feedback
   */
  async addTier2Feedback(trackCode: string, data: {
    learner_id: string
    lesson_id?: string
    module_id?: string
    comment_text: string
  }): Promise<{ id: number; comment_text: string; created_at: string }> {
    return apiGateway.post(`/curriculum/tier2/tracks/${trackCode}/feedback`, data)
  },

  /**
   * Get sample mission report for viewing
   * GET /curriculum/tier2/tracks/{code}/sample-report
   */
  async getTier2SampleReport(trackCode: string): Promise<{
    title: string
    description: string
    sections: Array<{ heading: string; content: string }>
    tip: string
  }> {
    return apiGateway.get(`/curriculum/tier2/tracks/${trackCode}/sample-report`)
  },

  /**
   * Intermediate Tracks specific endpoints
   */

  /**
   * Get Intermediate level track completion status
   * GET /curriculum/tier3/tracks/{code}/status
   */
  async getTier3Status(trackCode: string): Promise<{
    track_code: string
    track_name: string
    completion_percentage: number
    is_complete: boolean
    tier3_completion_requirements_met: boolean
    requirements: {
      mandatory_modules_total: number
      mandatory_modules_completed: number
      intermediate_missions_total: number
      intermediate_missions_passed: number
      mentor_approval: boolean
      mentor_approval_required: boolean
    }
    missing_requirements: string[]
    can_progress_to_tier4: boolean
    tier4_unlocked: boolean
    progression_mode?: 'sequential' | 'flexible'
  }> {
    return apiGateway.get(`/curriculum/tier3/tracks/${trackCode}/status`)
  },

  /**
   * Complete Intermediate level and unlock Advanced level
   * POST /curriculum/tier3/tracks/{code}/complete
   */
  async completeTier3(trackCode: string): Promise<{
    success: boolean
    message: string
    completed_at: string
    tier4_unlocked: boolean
  }> {
    return apiGateway.post(`/curriculum/tier3/tracks/${trackCode}/complete`)
  },

  /**
   * Advanced Tracks specific endpoints
   */

  /**
   * Get Advanced level track completion status
   * GET /curriculum/tier4/tracks/{code}/status
   */
  async getTier4Status(trackCode: string): Promise<{
    track_code: string
    track_name: string
    completion_percentage: number
    is_complete: boolean
    tier4_completion_requirements_met: boolean
    requirements: {
      mandatory_modules_total: number
      mandatory_modules_completed: number
      advanced_missions_total: number
      advanced_missions_approved: number
      feedback_cycles_complete: number
      reflections_required: number
      reflections_submitted: number
      mentor_approval: boolean
      mentor_approval_required: boolean
    }
    missing_requirements: string[]
    can_progress_to_tier5: boolean
    tier5_unlocked: boolean
    progression_mode?: 'sequential' | 'flexible'
  }> {
    return apiGateway.get(`/curriculum/tier4/tracks/${trackCode}/status`)
  },

  /**
   * Complete Advanced level and unlock Mastery level
   * POST /curriculum/tier4/tracks/{code}/complete
   */
  async completeTier4(trackCode: string): Promise<{
    success: boolean
    message: string
    completed_at: string
    tier5_unlocked: boolean
  }> {
    return apiGateway.post(`/curriculum/tier4/tracks/${trackCode}/complete`)
  },

  /**
   * Mastery Tracks specific endpoints
   */

  /**
   * Get Mastery level track completion status
   * GET /curriculum/tier5/tracks/{code}/status
   */
  async getTier5Status(trackCode: string): Promise<{
    track_code: string
    track_name: string
    completion_percentage: number
    is_complete: boolean
    tier5_completion_requirements_met: boolean
    requirements: {
      mandatory_modules_total: number
      mandatory_modules_completed: number
      mastery_missions_total: number
      mastery_missions_approved: number
      capstone_total: number
      capstone_approved: number
      reflections_required: number
      reflections_submitted: number
      rubric_passed: boolean
      mentor_approval: boolean
      mentor_approval_required: boolean
    }
    missing_requirements: string[]
    mastery_complete: boolean
    progression_mode?: 'sequential' | 'flexible'
  }> {
    return apiGateway.get(`/curriculum/tier5/tracks/${trackCode}/status`)
  },

  /**
   * Complete Mastery level
   * POST /curriculum/tier5/tracks/{code}/complete
   */
  async completeTier5(trackCode: string): Promise<{
    success: boolean
    message: string
    completed_at: string
    mastery_achieved: boolean
  }> {
    return apiGateway.post(`/curriculum/tier5/tracks/${trackCode}/complete`)
  },

  /**
   * Lesson bookmark: get status
   * GET /curriculum/lessons/{id}/bookmark/
   */
  async getLessonBookmark(lessonId: string): Promise<{ bookmarked: boolean }> {
    return apiGateway.get(`/curriculum/lessons/${lessonId}/bookmark/`)
  },

  /**
   * Lesson bookmark: add
   * POST /curriculum/lessons/{id}/bookmark/
   */
  async addLessonBookmark(lessonId: string): Promise<{ bookmarked: boolean; created?: boolean }> {
    return apiGateway.post(`/curriculum/lessons/${lessonId}/bookmark/`)
  },

  /**
   * Lesson bookmark: remove
   * DELETE /curriculum/lessons/{id}/bookmark/
   */
  async removeLessonBookmark(lessonId: string): Promise<{ bookmarked: boolean; deleted?: boolean }> {
    return apiGateway.delete(`/curriculum/lessons/${lessonId}/bookmark/`)
  },

  /**
   * List bookmarks (optional track filter)
   * GET /curriculum/bookmarks/?track_code=...
   */
  async getBookmarks(trackCode?: string): Promise<{ bookmarks: Array<{ lesson_id: string; lesson_title: string; module_title: string }> }> {
    const url = trackCode ? `/curriculum/bookmarks/?track_code=${encodeURIComponent(trackCode)}` : '/curriculum/bookmarks/'
    return apiGateway.get(url)
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
