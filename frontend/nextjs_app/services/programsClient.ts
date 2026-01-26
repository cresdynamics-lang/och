/**
 * Programs API Client
 * Handles all program, track, cohort, and enrollment operations
 */

import { apiGateway } from './apiGateway'

export interface Program {
  id?: string
  name: string
  category: 'technical' | 'leadership' | 'mentorship' | 'executive'
  categories?: ('technical' | 'leadership' | 'mentorship' | 'executive')[]
  description: string
  duration_months: number
  default_price: number
  currency: string
  outcomes: string[]
  structure?: Record<string, any>
  missions_registry_link?: string
  status: 'active' | 'inactive' | 'archived'
  tracks?: Track[]
  tracks_count?: number
  created_at?: string
  updated_at?: string
}

export interface Module {
  id?: string
  milestone?: string
  milestone_name?: string
  name: string
  description: string
  content_type: 'video' | 'article' | 'quiz' | 'assignment' | 'lab' | 'workshop'
  content_url: string
  order: number
  estimated_hours?: number
  skills: string[]
  applicable_tracks?: string[] | Track[]
  applicable_track_names?: string[]
  created_at?: string
  updated_at?: string
}

export interface Milestone {
  id?: string
  track?: string
  track_name?: string
  name: string
  description: string
  order: number
  duration_weeks?: number
  modules?: Module[]
  created_at?: string
  updated_at?: string
}

export interface Specialization {
  id?: string
  track?: string
  track_name?: string
  name: string
  description: string
  missions: string[]
  duration_weeks: number
  created_at?: string
  updated_at?: string
}

export interface Track {
  id?: string
  program?: string
  program_name?: string
  name: string
  key: string
  track_type: 'primary' | 'cross_track'
  description: string
  competencies: Record<string, any>
  missions: string[]
  director: string | number | null
  specializations?: Specialization[]
  milestones?: Milestone[]
  created_at?: string
  updated_at?: string
}

export interface Cohort {
  id: string
  track: string
  track_name?: string
  name: string
  start_date: string
  end_date: string
  mode: 'onsite' | 'virtual' | 'hybrid'
  seat_cap: number
  mentor_ratio: number
  calendar_id: string | null
  status: 'draft' | 'active' | 'running' | 'closing' | 'closed'
  seat_utilization?: number
  completion_rate?: number
  enrolled_count?: number
  seat_pool?: {
    paid?: number
    scholarship?: number
    sponsored?: number
  }
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  cohort: string
  cohort_name?: string
  user: string
  user_email?: string
  user_name?: string
  org: string | null
  enrollment_type: 'self' | 'sponsor' | 'invite'
  seat_type: 'paid' | 'scholarship' | 'sponsored'
  payment_status: 'pending' | 'paid' | 'waived'
  status: 'pending_payment' | 'pending' | 'active' | 'suspended' | 'withdrawn' | 'completed' | 'incomplete'
  joined_at: string
  completed_at: string | null
}

export interface CalendarEvent {
  id: string
  cohort: string
  cohort_name?: string
  type: 'orientation' | 'mentorship' | 'session' | 'project_review' | 'submission' | 'holiday' | 'closure'
  title: string
  description: string
  start_ts: string
  end_ts: string
  location?: string
  link?: string
  timezone?: string
  milestone_id?: string
  completion_tracked?: boolean
  status: 'scheduled' | 'done' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface MentorAssignment {
  id: string
  cohort: string
  cohort_name?: string
  mentor: string
  mentor_email?: string
  mentor_name?: string
  role: 'primary' | 'support' | 'guest'
  assigned_at: string
  active: boolean
}

export interface ProgramRule {
  id: string
  program: string
  program_name?: string
  rule: {
    criteria: {
      attendance_percent?: number
      portfolio_approved?: boolean
      feedback_score?: number
      payment_complete?: boolean
    }
    thresholds?: Record<string, any>
    dependencies?: string[]
  }
  version: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CohortDashboard {
  cohort_id: string
  cohort_name: string
  track_name: string
  enrollments_count: number
  seat_utilization: number
  mentor_assignments_count: number
  readiness_delta: number
  completion_percentage: number
  payments_complete: number
  payments_pending: number
}

class ProgramsClient {
  // Programs
  /**
   * Get all programs from /api/v1/programs/
   * Used by the "View Programs" view in director dashboard
   */
  async getPrograms(): Promise<Program[]> {
    try {
      console.log('📡 Fetching programs from /api/v1/programs/')
      const data = await apiGateway.get<any>('/programs/')
      console.log('📡 API Response:', {
        type: typeof data,
        isArray: Array.isArray(data),
        hasResults: data?.results !== undefined,
        hasData: data?.data !== undefined,
        count: Array.isArray(data) ? data.length : data?.results?.length || data?.count || 'N/A',
        totalCount: data?.count,
        hasNext: data?.next,
        keys: Object.keys(data || {}),
        data: data
      })
      
      // Handle paginated response (DRF default pagination)
      if (data?.results && Array.isArray(data.results)) {
        const programs = data.results
        console.log(`✅ Found ${programs.length} programs in paginated response (total: ${data.count || programs.length})`)
        
        // If there are more pages, fetch them all
        if (data.next) {
          console.log('📄 Multiple pages detected, fetching all pages...')
          let allPrograms = [...programs]
          let nextUrl = data.next
          
          while (nextUrl) {
            // Extract path from full URL
            const url = new URL(nextUrl)
            const path = url.pathname + url.search
            console.log(`📄 Fetching next page: ${path}`)
            
            const nextData = await apiGateway.get<any>(path.replace('/api/v1', ''))
            if (nextData?.results && Array.isArray(nextData.results)) {
              allPrograms = [...allPrograms, ...nextData.results]
              nextUrl = nextData.next
            } else {
              break
            }
          }
          
          console.log(`✅ Fetched all ${allPrograms.length} programs across all pages`)
          return allPrograms
        }
        
        return programs
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} programs in array response`)
        return data
      }
      
      // Handle data wrapper
      if (data?.data && Array.isArray(data.data)) {
        console.log(`✅ Found ${data.data.length} programs in data wrapper`)
        return data.data
      }
      
      console.warn('⚠️ Unexpected response format, returning empty array')
      return []
    } catch (error: any) {
      console.error('❌ Error in getPrograms:', error)
      throw error
    }
  }

  async getProgram(id: string): Promise<Program> {
    return apiGateway.get(`/programs/${id}/`)
  }

  async createProgram(data: Partial<Program>): Promise<Program> {
    // Use program-management endpoint for full structure support
    return apiGateway.post('/programs-management/', data)
  }

  async updateProgram(id: string, data: Partial<Program>): Promise<Program> {
    // Use program-management endpoint for full structure support
    return apiGateway.patch(`/programs-management/${id}/`, data)
  }

  async deleteProgram(id: string): Promise<void> {
    return apiGateway.delete(`/programs/${id}/`)
  }

  // Milestones
  async getMilestones(trackId?: string): Promise<Milestone[]> {
    const queryString = trackId ? `?track_id=${trackId}` : ''
    try {
      console.log(`📡 Fetching milestones from /api/v1/milestones/${queryString}`)
      const data = await apiGateway.get<any>(`/milestones/${queryString}`)
      console.log('📡 Milestones API Response:', {
        type: typeof data,
        isArray: Array.isArray(data),
        hasResults: data?.results !== undefined,
        count: Array.isArray(data) ? data.length : data?.results?.length || data?.count || 'N/A',
        trackId: trackId
      })
      
      // Handle paginated response (DRF default pagination)
      if (data?.results && Array.isArray(data.results)) {
        const milestones = data.results
        console.log(`✅ Found ${milestones.length} milestones in paginated response (total: ${data.count || milestones.length})`)
        
        // If there are more pages, fetch them all
        if (data.next) {
          console.log('📄 Multiple pages detected, fetching all pages...')
          let allMilestones = [...milestones]
          let nextUrl = data.next
          
          while (nextUrl) {
            // Extract path from full URL
            const url = new URL(nextUrl)
            const path = url.pathname + url.search
            console.log(`📄 Fetching next page: ${path}`)
            
            const nextData = await apiGateway.get<any>(path.replace('/api/v1', ''))
            if (nextData?.results && Array.isArray(nextData.results)) {
              allMilestones = [...allMilestones, ...nextData.results]
              nextUrl = nextData.next
            } else {
              break
            }
          }
          
          console.log(`✅ Fetched all ${allMilestones.length} milestones across all pages`)
          return allMilestones
        }
        
        return milestones
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} milestones in direct array response`)
        return data
      }
      
      console.warn('⚠️ Unexpected milestones response format:', data)
      return []
    } catch (error) {
      console.error('❌ Failed to fetch milestones:', error)
      throw error
    }
  }

  async createMilestone(data: Partial<Milestone>): Promise<Milestone> {
    return apiGateway.post('/milestones/', data)
  }

  async getMilestone(id: string): Promise<Milestone> {
    return apiGateway.get(`/milestones/${id}/`)
  }

  async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone> {
    return apiGateway.patch(`/milestones/${id}/`, data)
  }

  async deleteMilestone(id: string): Promise<void> {
    return apiGateway.delete(`/milestones/${id}/`)
  }

  // Modules
  async getModules(milestoneId?: string, trackId?: string): Promise<Module[]> {
    const params: string[] = []
    if (milestoneId) params.push(`milestone_id=${milestoneId}`)
    if (trackId) params.push(`track_id=${trackId}`)
    const queryString = params.length > 0 ? `?${params.join('&')}` : ''
    
    try {
      console.log(`📡 Fetching modules from /api/v1/modules/${queryString}`)
      const data = await apiGateway.get<any>(`/modules/${queryString}`)
      console.log('📡 Modules API Response:', {
        type: typeof data,
        isArray: Array.isArray(data),
        hasResults: data?.results !== undefined,
        count: Array.isArray(data) ? data.length : data?.results?.length || data?.count || 'N/A',
        milestoneId: milestoneId,
        trackId: trackId
      })
      
      // Handle paginated response (DRF default pagination)
      if (data?.results && Array.isArray(data.results)) {
        const modules = data.results
        console.log(`✅ Found ${modules.length} modules in paginated response (total: ${data.count || modules.length})`)
        
        // If there are more pages, fetch them all
        if (data.next) {
          console.log('📄 Multiple pages detected, fetching all pages...')
          let allModules = [...modules]
          let nextUrl = data.next
          
          while (nextUrl) {
            // Extract path from full URL
            const url = new URL(nextUrl)
            const path = url.pathname + url.search
            console.log(`📄 Fetching next page: ${path}`)
            
            const nextData = await apiGateway.get<any>(path.replace('/api/v1', ''))
            if (nextData?.results && Array.isArray(nextData.results)) {
              allModules = [...allModules, ...nextData.results]
              nextUrl = nextData.next
            } else {
              break
            }
          }
          
          console.log(`✅ Fetched all ${allModules.length} modules across all pages`)
          return allModules
        }
        
        return modules
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} modules in direct array response`)
        return data
      }
      
      console.warn('⚠️ Unexpected modules response format:', data)
      return []
    } catch (error) {
      console.error('❌ Failed to fetch modules:', error)
      throw error
    }
  }

  async createModule(data: Partial<Module>): Promise<Module> {
    return apiGateway.post('/modules/', data)
  }

  async updateModule(id: string, data: Partial<Module>): Promise<Module> {
    return apiGateway.patch(`/modules/${id}/`, data)
  }

  async deleteModule(id: string): Promise<void> {
    return apiGateway.delete(`/modules/${id}/`)
  }

  // Tracks
  async getTracks(programId?: string): Promise<Track[]> {
    // Endpoint: /api/v1/programs/tracks/ 
    const path = programId ? `/programs/tracks/?program_id=${programId}` : '/programs/tracks/'
    return apiGateway.get(path)
  }

  async getTrack(id: string): Promise<Track> {
    return apiGateway.get(`/programs/tracks/${id}/`)
  }

  async createTrack(data: Partial<Track>): Promise<Track> {
    return apiGateway.post('/programs/tracks/', data)
  }

  async updateTrack(id: string, data: Partial<Track>): Promise<Track> {
    return apiGateway.patch(`/programs/tracks/${id}/`, data)
  }

  async deleteTrack(id: string): Promise<void> {
    return apiGateway.delete(`/programs/tracks/${id}/`)
  }

  // Cohorts
  async getCohorts(params?: {
    trackId?: string
    status?: string
    page?: number
    pageSize?: number
    viewAll?: boolean
  }): Promise<{
    results: Cohort[]
    count: number
    next: string | null
    previous: string | null
  }> {
    const queryParams: string[] = []
    if (params?.trackId) queryParams.push(`track_id=${params.trackId}`)
    if (params?.status) queryParams.push(`status=${params.status}`)
    if (params?.page) queryParams.push(`page=${params.page}`)
    if (params?.pageSize) queryParams.push(`page_size=${params.pageSize}`)
    if (params?.viewAll) queryParams.push(`view_all=true`)
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
    return apiGateway.get(`/cohorts/${queryString}`)
  }

  async getCohort(id: string): Promise<Cohort> {
    return apiGateway.get(`/cohorts/${id}/`)
  }

  async createCohort(data: Partial<Cohort>): Promise<Cohort> {
    return apiGateway.post('/cohorts/', data)
  }

  async updateCohort(id: string, data: Partial<Cohort>): Promise<Cohort> {
    return apiGateway.patch(`/cohorts/${id}/`, data)
  }

  async updateCohortDirector(id: string, data: Partial<Cohort>): Promise<Cohort> {
    // Director cohort updates use the same endpoint as regular cohort updates
    // The DirectorCohortViewSet only has custom actions (manage_seat_pool, etc.)
    return apiGateway.patch(`/cohorts/${id}/`, data)
  }

  async manageSeatPool(cohortId: string, seatPool: { paid: number; scholarship: number; sponsored: number }): Promise<Cohort> {
    return apiGateway.post(`/director/cohorts/${cohortId}/manage_seat_pool/`, { seat_pool: seatPool })
  }

  async deleteCohort(id: string): Promise<void> {
    return apiGateway.delete(`/cohorts/${id}/`)
  }

  async getCohortDashboard(cohortId: string): Promise<CohortDashboard> {
    return apiGateway.get(`/cohorts/${cohortId}/dashboard/`)
  }

  // Calendar Events
  async getCohortCalendar(cohortId: string): Promise<CalendarEvent[]> {
    return apiGateway.get(`/cohorts/${cohortId}/calendar/`)
  }

  async createCalendarEvent(cohortId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return apiGateway.post(`/cohorts/${cohortId}/calendar/`, data)
  }

  async updateCalendarEvent(eventId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return apiGateway.patch(`/programs/calendar-events/${eventId}/`, data)
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    return apiGateway.delete(`/programs/calendar-events/${eventId}/`)
  }

  // Enrollments
  async getCohortEnrollments(cohortId: string): Promise<Enrollment[]> {
    return apiGateway.get(`/cohorts/${cohortId}/enrollments/`)
  }

  async createEnrollment(cohortId: string, data: Partial<Enrollment>): Promise<Enrollment> {
    return apiGateway.post(`/cohorts/${cohortId}/enrollments/`, data)
  }

  async updateEnrollment(enrollmentId: string, data: Partial<Enrollment>): Promise<Enrollment> {
    // Note: This requires backend support. For now, we'll use the cohort enrollment endpoint
    // TODO: Add proper enrollment detail endpoint in backend
    // This is a temporary workaround - enrollment updates should go through cohort context
    throw new Error('Enrollment update endpoint not yet implemented. Please use approve endpoint or update through cohort.')
  }

  async approveEnrollment(cohortId: string, enrollmentId: string): Promise<Enrollment> {
    return apiGateway.post(`/director/cohorts/${cohortId}/approve_enrollment/`, { enrollment_id: enrollmentId })
  }

  async bulkApproveEnrollments(cohortId: string, enrollmentIds: string[]): Promise<any> {
    return apiGateway.post(`/director/cohorts/${cohortId}/bulk_approve_enrollments/`, { enrollment_ids: enrollmentIds })
  }

  async updateEnrollmentStatus(cohortId: string, enrollmentId: string, status: string): Promise<Enrollment> {
    return apiGateway.patch(`/director/cohorts/${cohortId}/update_enrollment_status/`, { enrollment_id: enrollmentId, status })
  }

  async bulkUpdateEnrollmentsStatus(cohortId: string, enrollmentIds: string[], status: string): Promise<any> {
    return apiGateway.post(`/director/cohorts/${cohortId}/bulk_update_enrollments/`, { enrollment_ids: enrollmentIds, status })
  }

  async bulkRemoveEnrollments(cohortId: string, enrollmentIds: string[]): Promise<any> {
    return apiGateway.post(`/director/cohorts/${cohortId}/bulk_remove_enrollments/`, { enrollment_ids: enrollmentIds })
  }

  async bulkCreateEnrollments(cohortId: string, data: {
    user_ids: Array<string | number>
    seat_type?: 'paid' | 'scholarship' | 'sponsored'
    enrollment_type?: 'director' | 'invite' | 'sponsor' | 'self'
  }): Promise<{
    created: Enrollment[]
    waitlisted: any[]
    errors: Array<{ user_id: string; error: string }>
    requested: number
    created_count: number
    waitlisted_count: number
    error_count: number
  }> {
    return apiGateway.post(`/director/cohorts/${cohortId}/bulk_create_enrollments/`, data)
  }

  async getCohortWaitlist(cohortId: string): Promise<any[]> {
    return apiGateway.get(`/cohorts/${cohortId}/waitlist/`)
  }

  async promoteFromWaitlist(cohortId: string, count?: number): Promise<any> {
    return apiGateway.post(`/cohorts/${cohortId}/waitlist/`, { count: count || 1 })
  }

  // Mentor Assignments
  async getCohortMentors(cohortId: string): Promise<MentorAssignment[]> {
    return apiGateway.get(`/cohorts/${cohortId}/mentors/`)
  }

  async assignMentor(cohortId: string, data: Partial<MentorAssignment>): Promise<MentorAssignment> {
    return apiGateway.post(`/cohorts/${cohortId}/mentors/`, data)
  }

  async updateMentorAssignment(assignmentId: string, data: Partial<MentorAssignment>): Promise<MentorAssignment> {
    // Use the same endpoint as reassignMentor but allow updating role or other fields
    return apiGateway.patch(`/mentor-assignments/${assignmentId}/`, data)
  }

  async removeMentorAssignment(assignmentId: string): Promise<void> {
    return apiGateway.delete(`/mentor-assignments/${assignmentId}/`)
  }

  async getMentorAssignments(mentorId?: string): Promise<MentorAssignment[]> {
    // Get all mentor assignments, optionally filtered by mentor ID
    const params: Record<string, string> = {}
    if (mentorId) {
      params.mentor = mentorId
    }
    const response = await apiGateway.get<{ results: MentorAssignment[]; count: number } | MentorAssignment[]>(
      '/mentor-assignments/',
      { params }
    )
    if (Array.isArray(response)) {
      if (mentorId) {
        return response.filter((a) => {
          const aMentorId = typeof a.mentor === 'string' ? a.mentor : (a.mentor as any)?.toString()
          return aMentorId === mentorId || aMentorId === mentorId.toString()
        })
      }
      return response
    }
    const results = response.results || []
    if (mentorId) {
      return results.filter((a) => {
          const aMentorId = typeof a.mentor === 'string' ? a.mentor : (a.mentor as any)?.toString()
        return aMentorId === mentorId || aMentorId === mentorId.toString()
      })
    }
    return results
  }

  async listMentors(searchQuery?: string): Promise<any[]> {
    // Fetch users with mentor role from the users API
    const params: Record<string, string> = { role: 'mentor', page_size: '200' }
    if (searchQuery) {
      params.search = searchQuery
    }
    const response = await apiGateway.get<{ results: any[]; count: number } | any[]>('/users', { params })
    // Handle both array and paginated response formats
    if (Array.isArray(response)) {
      return response
    }
    return response.results || []
  }

  async getMentorAnalytics(mentorId: string): Promise<any> {
    return apiGateway.get(`/mentors/${mentorId}/analytics/`)
  }

  async autoMatchMentors(cohortId: string, trackId?: string, role: string = 'support'): Promise<{ assignments: any[] }> {
    return apiGateway.post(`/cohorts/${cohortId}/mentors/auto-match/`, { track_id: trackId, role })
  }

  async reassignMentor(assignmentId: string, newMentorId: string): Promise<MentorAssignment> {
    return apiGateway.patch(`/mentor-assignments/${assignmentId}/`, { mentor: newMentorId })
  }

  async getMentorReviews(mentorId: string, cohortId?: string): Promise<any[]> {
    const queryString = cohortId ? `?cohort_id=${cohortId}` : ''
    return apiGateway.get(`/mentors/${mentorId}/reviews/${queryString}`)
  }

  async updateMenteeGoal(menteeId: string, goalId: string, updates: any): Promise<any> {
    return apiGateway.patch(`/mentees/${menteeId}/goals/${goalId}/`, updates)
  }

  async approveCycleClosure(cohortId: string, mentorId: string): Promise<any> {
    return apiGateway.post(`/cohorts/${cohortId}/mentors/${mentorId}/approve-closure/`)
  }

  async sendCohortNotification(cohortId: string, notification: { type: string; message: string; recipients?: string[] }): Promise<void> {
    return apiGateway.post(`/cohorts/${cohortId}/notifications/`, notification)
  }

  // Mentorship Cycle Configuration
  async saveMentorshipCycle(cohortId: string, cycleData: {
    duration_weeks: number
    frequency: 'weekly' | 'bi-weekly' | 'monthly'
    milestones: string[]
    goals: string[]
    program_type?: string
  }): Promise<any> {
    return apiGateway.post(`/cohorts/${cohortId}/mentorship-cycle/`, cycleData)
  }

  // Mission Review Oversight
  async getMissionReviews(cohortId?: string, premiumOnly?: boolean): Promise<any[]> {
    const params: Record<string, string> = {}
    if (cohortId) params.cohort_id = cohortId
    if (premiumOnly) params.premium_only = 'true'
    const queryString = new URLSearchParams(params).toString()
    return apiGateway.get(`/mission-reviews/${queryString ? `?${queryString}` : ''}`)
  }

  // Session Management
  async getCohortSessions(cohortId: string): Promise<any[]> {
    return apiGateway.get(`/cohorts/${cohortId}/sessions/`)
  }

  // Goal Tracking
  async getCohortGoals(cohortId: string): Promise<any[]> {
    return apiGateway.get(`/cohorts/${cohortId}/goals/`)
  }

  // Rubric Management
  async getTrackRubrics(trackId: string): Promise<any[]> {
    return apiGateway.get(`/tracks/${trackId}/rubrics/`)
  }

  async createRubric(trackId: string, rubricData: any): Promise<any> {
    return apiGateway.post(`/tracks/${trackId}/rubrics/`, rubricData)
  }

  // Conflict Resolution
  async getMentorConflicts(): Promise<any[]> {
    return apiGateway.get(`/mentors/conflicts/`)
  }

  async resolveConflict(conflictId: string, resolution: any): Promise<any> {
    return apiGateway.post(`/mentors/conflicts/${conflictId}/resolve/`, resolution)
  }

  // Audit Trail
  async getMentorshipAuditLogs(filters: { start_date?: string; end_date?: string; action_type?: string }): Promise<any[]> {
    const params = new URLSearchParams()
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.action_type) params.append('action_type', filters.action_type)
    const queryString = params.toString()
    return apiGateway.get(`/mentorship/audit-logs/${queryString ? `?${queryString}` : ''}`)
  }

  // Program Rules
  async getProgramRules(programId?: string): Promise<ProgramRule[]> {
    const queryString = programId ? `?program_id=${programId}` : ''
    return apiGateway.get(`/rules/${queryString}`)
  }

  async createProgramRule(data: Partial<ProgramRule>): Promise<ProgramRule> {
    return apiGateway.post('/rules/', data)
  }

  async updateProgramRule(id: string, data: Partial<ProgramRule>): Promise<ProgramRule> {
    return apiGateway.put(`/rules/${id}/`, data)
  }

  async deleteProgramRule(id: string): Promise<void> {
    return apiGateway.delete(`/rules/${id}/`)
  }

  // Auto-graduation
  async autoGraduateCohort(cohortId: string, ruleId?: string): Promise<{
    completed: number
    incomplete: number
    certificates_generated: number
    errors: string[]
  }> {
    return apiGateway.post(`/cohorts/${cohortId}/auto_graduate/`, { rule_id: ruleId })
  }

  // Export Reports
  async exportCohortReport(cohortId: string, format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}/api/v1/cohorts/${cohortId}/export/?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('auth_token') || ''}`,
        },
      }
    )
    if (!response.ok) {
      throw new Error('Export failed')
    }
    return response.blob()
  }

  // Director Dashboard
  async getDirectorDashboard(): Promise<DirectorDashboard> {
    return apiGateway.get('/programs/director/dashboard/')
  }

  async getDirectorCohortDetail(cohortId: string): Promise<any> {
    return apiGateway.get(`/director/dashboard/cohorts/${cohortId}/`)
  }
}

export interface DirectorAlert {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  cohort_id?: string
  action_url: string
}

export interface CohortTableRow {
  id: string
  name: string
  track_name: string
  program_name: string
  status: string
  seats_used: number
  seats_available: number
  seats_total: number
  readiness_delta: number
  completion_rate: number
  mentor_coverage: number
  upcoming_milestones: Array<{
    title: string
    date: string
    type: string
  }>
  start_date: string | null
  end_date: string | null
}

export interface DirectorDashboard {
  hero_metrics: {
    active_programs: number
    active_cohorts: number
    seats_used: number
    seats_available: number
    seat_utilization: number
    avg_readiness: number
    avg_completion_rate: number
    revenue_per_seat: number
  }
  alerts: DirectorAlert[]
  cohort_table: CohortTableRow[]
  programs: Program[]
}

export const programsClient = new ProgramsClient()