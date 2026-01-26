/**
 * Sponsor Dashboard API Client
 */
import { apiGateway } from './apiGateway'

export interface SponsorDashboardSummary {
  org_id: string
  seats_total: number
  seats_used: number
  seats_at_risk: number
  budget_total: number
  budget_used: number
  budget_used_pct: number
  avg_readiness: number
  avg_completion_pct: number
  graduates_count: number
  active_cohorts_count: number
  alerts: string[]
  cache_updated_at: string
}

export interface SponsorCohort {
  cohort_id: string
  cohort_name: string
  track_name: string
  seats_total: number
  seats_used: number
  seats_sponsored: number
  seats_remaining: number
  avg_readiness: number | null
  completion_pct: number | null
  graduates_count: number
  at_risk_count: number
  next_milestone: {
    title: string
    date: string
    type: string
  } | null
  flags: string[]
  budget_remaining: number | null
}

export interface SponsorCohortDetail extends SponsorCohort {
  seats: {
    total: number
    used: number
    sponsored: number
    remaining: number
    at_risk: number
  }
  progress: {
    avg_readiness: number | null
    completion_pct: number | null
    portfolio_health: number | null
  }
  top_graduates: number
  budget: {
    allocated: number | null
    spent: number | null
    remaining: number | null
  }
  shared_profiles: number
  next_events: any[]
}

export interface SponsorStudent {
  student_id: string
  name_anonymized: string
  readiness_score: number | null
  completion_pct: number | null
  portfolio_items: number
  consent_employer_share: boolean
}

export interface SponsorStudentProfile {
  student_id: string
  name: string
  email: string | null
  readiness_score: number | null
  completion_pct: number | null
  portfolio_items: number
  cohort: {
    id: string
    name: string
  }
  enrollment_status: string
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  created_at: string
  file_url: string | null
}

export interface StudentPortfolio {
  student_id: string
  portfolio_items: PortfolioItem[]
  total_items: number
}

export interface CompetencyDefinition {
  id: string
  name: string
  description: string
}

export interface CompetenciesResponse {
  competencies: CompetencyDefinition[]
  count: number
}

export interface SponsorCode {
  id: string
  code: string
  seats: number
  value_per_seat: number | null
  valid_from: string | null
  valid_until: string | null
  usage_count: number
  max_usage: number | null
  status: 'active' | 'expired' | 'revoked'
  is_valid: boolean
  created_at: string
}

class SponsorClient {
  /**
   * Get sponsor dashboard summary
   */
  async getSummary(): Promise<SponsorDashboardSummary> {
    return apiGateway.get('/sponsor/dashboard/summary')
  }

  /**
   * Get sponsored cohorts list
   */
  async getCohorts(params?: {
    limit?: number
    offset?: number
    cursor?: string
  }): Promise<{
    results: SponsorCohort[]
    next_cursor: string | null
    count: number
  }> {
    return apiGateway.get('/sponsor/dashboard/cohorts', { params })
  }

  /**
   * Get cohort detail
   */
  async getCohortDetail(cohortId: string): Promise<SponsorCohortDetail> {
    return apiGateway.get(`/sponsor/dashboard/cohorts/${cohortId}`)
  }

  /**
   * Get student aggregates (consent-gated)
   */
  async getStudents(params?: {
    cohort_id?: string
    readiness_gte?: number
    limit?: number
  }): Promise<SponsorStudent[]> {
    return apiGateway.get('/sponsor/dashboard/students', { params })
  }

  /**
   * Get graduates pool (consent-gated)
   */
  async getGraduates(params?: {
    readiness_gte?: number
    limit?: number
  }): Promise<SponsorStudent[]> {
    return apiGateway.get('/sponsor/graduates', { params })
  }

  /**
   * Request graduate CV
   */
  async requestGraduateCV(userId: string): Promise<{ cv_url?: string }> {
    return apiGateway.post(`/sponsor/graduates/${userId}/request_cv`)
  }

  /**
   * Assign seats to users
   */
  async assignSeats(data: {
    cohort_id: string
    user_ids: string[]
    code?: string
  }): Promise<{
    code?: string
    seats_assigned: number
    enrollment_ids: string[]
  }> {
    return apiGateway.post('/sponsor/seats/assign', data)
  }

  /**
   * Generate sponsor codes
   */
  async generateCodes(data: {
    seats: number
    value_per_seat?: number
    valid_from?: string
    valid_until?: string
    max_usage?: number
    count?: number
  }): Promise<SponsorCode[]> {
    return apiGateway.post('/sponsor/codes/generate', data)
  }

  /**
   * List sponsor codes
   */
  async getCodes(): Promise<SponsorCode[]> {
    return apiGateway.get('/sponsor/codes')
  }

  /**
   * Get invoices
   */
  async getInvoices(): Promise<any[]> {
    return apiGateway.get('/sponsor/invoices')
  }

  /**
   * Export reports
   */
  async exportReport(data: {
    format: 'json' | 'csv'
    type: string
  }): Promise<any> {
    return apiGateway.post('/sponsor/reports/export', data)
  }

  /**
   * Get student profile (consent-gated)
   */
  async getStudentProfile(studentId: string): Promise<SponsorStudentProfile> {
    return apiGateway.get(`/sponsor/dashboard/students/${studentId}`)
  }

  /**
   * Get student portfolio (consent-gated with portfolio.public_page)
   */
  async getStudentPortfolio(studentId: string): Promise<StudentPortfolio> {
    return apiGateway.get(`/sponsor/dashboard/students/${studentId}/portfolio`)
  }

  /**
   * Get competency/role definitions from MCRR
   */
  async getCompetencies(): Promise<CompetenciesResponse> {
    return apiGateway.get('/sponsor/dashboard/competencies')
  }
}

export const sponsorClient = new SponsorClient()

