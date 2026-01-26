/**
 * Program Director API Client
 */
import { apiGateway } from './apiGateway'

export interface DirectorDashboardSummary {
  programs_count: number
  cohorts_count: number
  active_cohorts_count: number
  total_seats: number
  seats_used: number
  seats_utilization: number
  pending_enrollments: number
  at_risk_cohorts: Array<{
    cohort_id: string
    cohort_name: string
    risk_score: number
  }>
}

export interface CohortReadinessAnalytics {
  cohort_id: string
  avg_readiness: number
  distribution: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  total_students: number
  trend: number[]
}

export interface MissionFunnelAnalytics {
  total_missions: number
  completed: number
  in_progress: number
  not_started: number
  bottlenecks: Array<{
    mission_id: string
    stuck_count: number
    avg_days_stuck: number
  }>
  approval_times: {
    avg_hours: number
    p95_hours: number
  }
}

export interface PortfolioHeatmap {
  cohort_id: string
  competencies: Record<string, {
    covered: number
    avg_items: number
    gap_count: number
  }>
  overall_coverage: number
}

export interface AtRiskStudent {
  enrollment_id: string
  user_id: string
  user_email: string
  risk_score: number
  risk_factors: string[]
}

export interface MentorWorkload {
  mentor_id: string
  mentor_email: string
  mentee_count: number
  primary_count: number
  is_overloaded: boolean
}

export interface CohortClosurePack {
  cohort_id: string
  cohort_name: string
  total_enrolled: number
  completed: number
  incomplete: number
  avg_readiness: number
  completion_rate: number
  certificates_issued: number
  closure_date: string
}

class DirectorClient {
  private baseUrl = '/api/v1/programs/director'
  private dashboardBaseUrl = '/api/v1/director'

  async getDashboardSummary(): Promise<DirectorDashboardSummary> {
    return apiGateway.get(`${this.baseUrl}/dashboard/summary/`)
  }

  async getPrograms() {
    return apiGateway.get(`${this.baseUrl}/programs/`)
  }

  async createProgram(data: any) {
    return apiGateway.post(`${this.baseUrl}/programs/`, data)
  }

  async getTracks(programId?: string) {
    const url = programId 
      ? `${this.baseUrl}/tracks/?program_id=${programId}`
      : `${this.baseUrl}/tracks/`
    return apiGateway.get(url)
  }

  async createTrack(data: any) {
    return apiGateway.post(`${this.baseUrl}/tracks/`, data)
  }

  async getCohorts(status?: string) {
    const url = status
      ? `${this.baseUrl}/cohorts/?status=${status}`
      : `${this.baseUrl}/cohorts/`
    return apiGateway.get(url)
  }

  async createCohort(data: any) {
    return apiGateway.post(`${this.baseUrl}/cohorts/`, data)
  }

  async updateCohortStatus(cohortId: string, status: string) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/update_status/`, { status })
  }

  async manageSeatPool(cohortId: string, seatPool: Record<string, number>) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/manage_seat_pool/`, { seat_pool: seatPool })
  }

  async getCohortReadiness(cohortId: string): Promise<CohortReadinessAnalytics> {
    return apiGateway.get(`${this.baseUrl}/cohorts/${cohortId}/readiness/`)
  }

  async getMissionFunnel(cohortId: string): Promise<MissionFunnelAnalytics> {
    return apiGateway.get(`${this.baseUrl}/cohorts/${cohortId}/mission_funnel/`)
  }

  async getPortfolioHeatmap(cohortId: string): Promise<PortfolioHeatmap> {
    return apiGateway.get(`${this.baseUrl}/cohorts/${cohortId}/portfolio_heatmap/`)
  }

  async getAtRiskStudents(cohortId: string): Promise<{ at_risk_students: AtRiskStudent[] }> {
    return apiGateway.get(`${this.baseUrl}/cohorts/${cohortId}/at_risk/`)
  }

  async approveEnrollment(cohortId: string, enrollmentId: string) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/approve_enrollment/`, { enrollment_id: enrollmentId })
  }

  async bulkApproveEnrollments(cohortId: string, enrollmentIds: string[]) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/bulk_approve_enrollments/`, { enrollment_ids: enrollmentIds })
  }

  async getMentorWorkload(cohortId: string): Promise<{ workload: MentorWorkload[] }> {
    return apiGateway.get(`${this.baseUrl}/cohorts/${cohortId}/mentor_workload/`)
  }

  async rebalanceMentors(cohortId: string) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/rebalance_mentors/`)
  }

  async getClosurePack(cohortId: string): Promise<CohortClosurePack> {
    return apiGateway.get(`${this.baseUrl}/cohorts/${cohortId}/closure_pack/`)
  }

  async exportCohortData(cohortId: string, format: 'csv' | 'json' = 'json') {
    const url = `${this.baseUrl}/cohorts/${cohortId}/export/?format=${format}`
    if (format === 'csv') {
      // For CSV, fetch directly to get blob
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      return await response.blob()
    }
    return apiGateway.get(url)
  }

  async getCalendar(cohortId: string) {
    return apiGateway.get(`${this.baseUrl}/cohorts/${cohortId}/calendar/`)
  }

  async createStandardCalendar(cohortId: string) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/calendar/`, { action: 'create_standard' })
  }

  async createCalendarFromTemplate(cohortId: string, templateEvents: any[]) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/calendar/`, {
      action: 'create_from_template',
      template_events: templateEvents
    })
  }

  async archiveCohort(cohortId: string) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/archive/`)
  }

  async triggerCertificates(cohortId: string, autoApprove: boolean = false) {
    return apiGateway.post(`${this.baseUrl}/cohorts/${cohortId}/trigger_certificates/`, { auto_approve: autoApprove })
  }

  async assignMentor(data: { cohort_id: string; mentor_id: string; mentee_id: string; is_primary?: boolean }) {
    return apiGateway.post(`${this.baseUrl}/mentors/assign/`, data)
  }

  async getRules(programId?: string) {
    const url = programId
      ? `${this.baseUrl}/rules/?program_id=${programId}`
      : `${this.baseUrl}/rules/`
    return apiGateway.get(url)
  }

  async createRule(data: any) {
    return apiGateway.post(`${this.baseUrl}/rules/`, data)
  }

  async activateRule(ruleId: string) {
    return apiGateway.post(`${this.baseUrl}/rules/${ruleId}/activate/`)
  }

  // Dashboard endpoints
  async getDashboard() {
    return apiGateway.get(`${this.dashboardBaseUrl}/dashboard/dashboard/`)
  }

  async getCohortsTable(riskLevel?: string, limit: number = 20) {
    const params = new URLSearchParams()
    if (riskLevel) params.append('risk_level', riskLevel)
    params.append('limit', limit.toString())
    return apiGateway.get(`${this.dashboardBaseUrl}/dashboard/cohorts/?${params.toString()}`)
  }

  async refreshDashboardCache() {
    return apiGateway.post(`${this.dashboardBaseUrl}/dashboard/refresh_cache/`)
  }
}

export const directorClient = new DirectorClient()

