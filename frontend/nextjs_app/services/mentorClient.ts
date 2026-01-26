/**
 * Mentor Service Client
 * Handles all mentor-specific API endpoints for mentee management, mission reviews, sessions, and analytics
 */

import { apiGateway } from './apiGateway'
import type {
  AssignedMentee,
  MentorProfile,
  MissionSubmission,
  MissionReview,
  CapstoneProject,
  CapstoneScore,
  GroupMentorshipSession,
  MenteeGoal,
  MenteeFlag,
  TrackAssignment,
  MenteePerformance,
  TalentScopeMentorView,
  MentorInfluenceIndex,
  MentorshipMessage,
  NotificationLog,
} from './types/mentor'

export const mentorClient = {
  /**
   * I. Mentee Management and Assignment Features
   */

  /**
   * Get list of assigned mentees
   */
  async getAssignedMentees(mentorId: string): Promise<AssignedMentee[]> {
    return apiGateway.get(`/mentors/${mentorId}/mentees`)
  },

  /**
   * Get mentor profile
   */
  async getMentorProfile(mentorId: string): Promise<MentorProfile> {
    return apiGateway.get(`/mentors/${mentorId}/profile`)
  },

  /**
   * Update mentor profile
   */
  async updateMentorProfile(mentorId: string, data: {
    bio?: string
    expertise_tags?: string[]
    availability?: MentorProfile['availability']
  }): Promise<MentorProfile> {
    return apiGateway.patch(`/mentors/${mentorId}/profile`, data)
  },

  /**
   * II. Mission Review and Feedback Features
   */

  /**
   * Get all missions defined by directors (read-only for mentors)
   */
  async getAllMissions(mentorId: string, params?: {
    track?: string
    tier?: string
    difficulty?: string
    type?: string
    search?: string
    is_active?: boolean
    limit?: number
    offset?: number
  }): Promise<{ results: any[]; count: number }> {
    return apiGateway.get(`/mentors/${mentorId}/missions`, { params })
  },

  /**
   * Get mission submission queue (only Professional tier submissions)
   */
  async getMissionSubmissionQueue(mentorId: string, params?: {
    status?: 'pending_review' | 'in_review' | 'all'
    limit?: number
    offset?: number
  }): Promise<{ results: MissionSubmission[]; count: number }> {
    return apiGateway.get(`/mentors/${mentorId}/missions/submissions`, { params })
  },

  /**
   * Update mission submission status
   */
  async updateSubmissionStatus(submissionId: string, status: 'in_progress' | 'in_mentor_review' | 'scheduled' | 'reviewed', notes?: string): Promise<any> {
    return apiGateway.patch(`/mentors/missions/submissions/${submissionId}/status`, {
      status,
      notes,
    })
  },

  /**
   * Get detailed mission submission
   */
  async getMissionSubmission(submissionId: string): Promise<MissionSubmission> {
    return apiGateway.get(`/mentors/missions/submissions/${submissionId}`)
  },

  /**
   * Get mission submissions for a specific mission
   */
  async getMissionSubmissions(mentorId: string, params?: {
    mission_id?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<MissionSubmission[]> {
    const response = await apiGateway.get(`/mentors/${mentorId}/missions/submissions`, { params }) as any
    // Filter by mission_id on frontend if backend doesn't support it
    if (params?.mission_id && response.results) {
      return response.results.filter((sub: MissionSubmission) => sub.mission_id === params.mission_id)
    }
    return response.results || []
  },

  /**
   * Submit mission review with detailed analysis
   */
  async submitMissionReview(submissionId: string, data: {
    overall_status: 'pass' | 'fail' | 'needs_revision'
    feedback?: {
      written?: string
      audio_url?: string
    }
    comments?: Array<{
      comment: string
      section?: string
    }>
    technical_competencies?: string[]
    score_breakdown?: Record<string, number>
    recommended_next_missions?: string[]
  }): Promise<MissionReview> {
    return apiGateway.post(`/mentors/missions/submissions/${submissionId}/review`, data)
  },

  /**
   * Get capstone projects pending scoring
   */
  async getCapstoneProjects(mentorId: string, params?: {
    status?: 'pending_scoring' | 'all'
  }): Promise<CapstoneProject[]> {
    return apiGateway.get(`/mentors/${mentorId}/capstones`, { params })
  },

  /**
   * Get missions from cohorts assigned to mentor (read-only view)
   */
  async getCohortMissions(mentorId: string, params?: {
    page?: number
    page_size?: number
    difficulty?: string
    track?: string
    search?: string
  }): Promise<{
    results: any[]
    count: number
    total: number
    page: number
    page_size: number
    has_next: boolean
    has_previous: boolean
  }> {
    return apiGateway.get(`/mentors/${mentorId}/missions/cohorts`, { params })
  },

  /**
   * Score capstone project
   */
  async scoreCapstone(capstoneId: string, data: {
    overall_score: number
    score_breakdown: {
      technical_quality: number
      problem_solving: number
      documentation: number
      presentation: number
      innovation: number
    }
    feedback: string
    recommendations?: string[]
  }): Promise<CapstoneScore> {
    return apiGateway.post(`/mentors/capstones/${capstoneId}/score`, data)
  },

  /**
   * III. Coaching and Session Management
   */

  /**
   * Get group mentorship sessions
   */
  async getGroupSessions(mentorId: string, params?: {
    status?: 'scheduled' | 'completed' | 'all'
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  }): Promise<{
    results: GroupMentorshipSession[]
    count: number
    page: number
    page_size: number
    total_pages: number
    next: string | null
    previous: string | null
  }> {
    return apiGateway.get(`/mentors/${mentorId}/sessions`, { params })
  },

  /**
   * Create group mentorship session
   */
  async createGroupSession(mentorId: string, data: {
    title: string
    description: string
    scheduled_at: string
    duration_minutes: number
    meeting_type: 'zoom' | 'google_meet' | 'in_person'
    meeting_link?: string
    track_assignment?: string
    cohort_id?: string
  }): Promise<GroupMentorshipSession> {
    console.log('[mentorClient] Creating group session with data:', data)
    return apiGateway.post(`/mentors/${mentorId}/sessions`, data)
  },

  /**
   * Update group session (post-session management)
   */
  async updateGroupSession(sessionId: string, data: {
    recording_url?: string
    transcript_url?: string
    attendance?: Array<{
      mentee_id: string
      attended: boolean
      joined_at?: string
      left_at?: string
    }>
    structured_notes?: {
      key_takeaways?: string[]
      action_items?: Array<{ item: string; assignee?: string }>
      discussion_points?: string
      challenges?: string
      wins?: string
      next_steps?: string
      mentor_reflections?: string
      linked_goals?: string[]
      attached_files?: Array<{ name: string; url: string }>
    }
    scheduled_at?: string
    duration_minutes?: number
    is_closed?: boolean
    attended?: boolean
    cancelled?: boolean
    cancellation_reason?: string
  }): Promise<GroupMentorshipSession> {
    return apiGateway.patch(`/mentors/sessions/${sessionId}`, data)
  },

  /**
   * Get mentee goals (monthly/weekly) for Professional tier
   */
  async getMenteeGoals(mentorId: string, params?: {
    mentee_id?: string
    goal_type?: 'monthly' | 'weekly'
    status?: 'pending' | 'in_progress' | 'completed'
  }): Promise<MenteeGoal[]> {
    return apiGateway.get(`/mentors/${mentorId}/goals`, { params })
  },

  /**
   * Provide feedback on mentee goal
   */
  async provideGoalFeedback(goalId: string, data: {
    feedback: string
  }): Promise<MenteeGoal> {
    return apiGateway.post(`/mentors/goals/${goalId}/feedback`, data)
  },

  /**
   * Flag a mentee who is struggling
   * Backend endpoint: POST /api/v1/mentor/flags
   * Note: Backend gets mentor from authenticated user, so mentorId is not needed in URL
   */
  async flagMentee(mentorId: string, data: {
    mentee_id: string
    flag_type: 'struggling' | 'at_risk' | 'needs_attention' | 'technical_issue'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }): Promise<MenteeFlag> {
    // Backend expects: mentee_id, reason (not description), severity
    // Map description to reason and flag_type is not used by backend but kept for frontend consistency
    return apiGateway.post(`/mentor/flags`, {
      mentee_id: data.mentee_id,
      reason: data.description, // Backend expects 'reason' field
      severity: data.severity,
    })
  },

  /**
   * Get mentee flags
   */
  async getMenteeFlags(mentorId: string, params?: {
    status?: 'open' | 'resolved' | 'all'
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }): Promise<MenteeFlag[]> {
    return apiGateway.get(`/mentors/${mentorId}/flags`, { params })
  },

  /**
   * Update a mentee flag (acknowledge/resolve)
   * Expected backend route: PATCH /mentors/flags/{flagId}
   */
  async updateMenteeFlag(flagId: string, data: {
    status?: 'acknowledged' | 'resolved'
    resolution_notes?: string
  }): Promise<MenteeFlag> {
    return apiGateway.patch(`/mentors/flags/${flagId}`, data)
  },

  /**
   * Assign user to a track (track assignment override)
   */
  async assignTrack(data: {
    user_id: string
    track_key: string
    reason?: string
  }): Promise<TrackAssignment> {
    return apiGateway.post(`/mentors/track-assignments`, data)
  },

  /**
   * IV. Performance Tracking and Analytics
   */

  /**
   * Get mentee performance tracking
   */
  async getMenteePerformance(mentorId: string, menteeId: string): Promise<MenteePerformance> {
    return apiGateway.get(`/mentors/${mentorId}/mentees/${menteeId}/performance`)
  },

  /**
   * Get TalentScope mentor view for a mentee
   */
  async getTalentScopeView(mentorId: string, menteeId: string): Promise<TalentScopeMentorView> {
    return apiGateway.get(`/mentors/${mentorId}/mentees/${menteeId}/talentscope`)
  },

  /**
   * Get mentor influence index
   */
  async getInfluenceIndex(mentorId: string, params?: {
    start_date?: string
    end_date?: string
  }): Promise<MentorInfluenceIndex> {
    return apiGateway.get(`/mentors/${mentorId}/influence`, { params })
  },

  /**
   * Get alerts for mentor (flags, overdue items, etc.)
   */
  async getAlerts(mentorId: string): Promise<import('./types/mentor').MentorAlert[]> {
    // Get flags and convert to alerts format
    const flags = await this.getMenteeFlags(mentorId, { status: 'open' })
    return flags.map(flag => ({
      id: flag.id,
      type: 'flag' as const,
      severity: flag.severity,
      title: `${flag.flag_type} - ${flag.mentee_name}`,
      description: flag.description,
      mentee_id: flag.mentee_id,
      mentee_name: flag.mentee_name,
      related_id: flag.id,
      created_at: flag.raised_at,
      resolved: flag.status === 'resolved',
    }))
  },

  /**
   * 4.8 Communication & Notifications
   */

  /**
   * Get mentorship assignment
   */
  async getMentorshipAssignment(params?: {
    menteeId?: string
    mentorId?: string
  }): Promise<{
    id: string
    mentee_id: string
    mentee_name: string
    mentor_id: string
    mentor_name: string
    status: string
    assigned_at: string
  }> {
    // Convert camelCase to snake_case for backend API
    const backendParams: Record<string, string> = {}
    if (params?.menteeId) {
      backendParams.mentee_id = params.menteeId
    }
    if (params?.mentorId) {
      backendParams.mentor_id = params.mentorId
    }
    return apiGateway.get('/mentorship/assignment', { params: backendParams })
  },

  /**
   * Get all assignments for a mentor (includes assignments created when students send first message)
   */
  async getMentorAssignments(mentorId: string): Promise<Array<{
    id: string
    mentee_id: string
    mentee_name: string
    mentee_email: string
    cohort_id: string | null
    assigned_at: string | null
    last_message_time: string | null
    unread_count: number
  }>> {
    return apiGateway.get(`/mentorship/mentors/${mentorId}/assignments`)
  },

  /**
   * Get messages for a mentor-mentee assignment
   * Returns messages and optionally the correct assignment_id if it changed
   */
  async getMessages(assignmentId: string): Promise<MentorshipMessage[] | { messages: MentorshipMessage[], assignment_id: string, assignment_id_changed: boolean }> {
    const response = await apiGateway.get(`/mentorship/assignments/${assignmentId}/messages`) as any
    // Handle both array response (old format) and object response (new format with assignment_id)
    if (Array.isArray(response)) {
      return response
    } else if (response?.messages && Array.isArray(response.messages)) {
      // New format - return as object with assignment_id
      return response
    } else {
      // Fallback
      return []
    }
  },

  /**
   * Send a message with optional file attachments
   */
  async sendMessage(assignmentId: string, data: {
    body: string
    attachments?: File[]
  }): Promise<MentorshipMessage> {
    const formData = new FormData()
    formData.append('body', data.body)
    
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file)
      })
    }
    
    return apiGateway.post(`/mentorship/assignments/${assignmentId}/messages`, formData)
  },

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId: string): Promise<MentorshipMessage> {
    return apiGateway.patch(`/mentorship/messages/${messageId}/read`)
  },

  /**
   * Send a notification
   */
  async sendNotification(data: {
    assignmentId?: string
    sessionId?: string
    recipientId: string
    notificationType: NotificationLog['notification_type']
    channel?: NotificationLog['channel']
    subject?: string
    message: string
    metadata?: Record<string, any>
  }): Promise<NotificationLog> {
    return apiGateway.post('/mentorship/notifications', {
      assignment_id: data.assignmentId,
      session_id: data.sessionId,
      recipient_id: data.recipientId,
      notification_type: data.notificationType,
      channel: data.channel || 'email',
      subject: data.subject,
      message: data.message,
      metadata: data.metadata || {},
    })
  },

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, params?: {
    type?: NotificationLog['notification_type']
    channel?: NotificationLog['channel']
    status?: NotificationLog['status']
  }): Promise<NotificationLog[]> {
    return apiGateway.get(`/mentorship/users/${userId}/notifications`, { params })
  },
}

