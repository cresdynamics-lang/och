/**
 * Sponsor Dashboard API Client - Updated for OCH SMP Technical Specifications
 */
import { apiGateway } from './apiGateway'

// =============================================================================
// 🔑 Identity & Organization Types
// =============================================================================
export interface SponsorProfile {
  user_id: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  roles: Array<{
    role_name: string
    scope_type: string
    scope_id: string
  }>
  consent_scopes: Array<{
    scope_type: string
    granted_at: string
    expires_at: string | null
  }>
  sponsor_organizations: Array<{
    id: string
    name: string
    slug: string
    role: string
  }>
}

export interface SponsorSignupData {
  email: string
  password: string
  first_name: string
  last_name: string
  organization_name: string
  sponsor_type?: 'corporate' | 'university' | 'scholarship'
  website?: string
  country?: string
  city?: string
  region?: string
}

// =============================================================================
// 📚 Program & Cohort Types
// =============================================================================
export interface SponsorCohort {
  cohort_id: string
  name: string
  sponsor: string
  track_slug: string
  target_size: number
  students_enrolled: number
  completion_rate: number
  start_date: string | null
  expected_graduation_date: string | null
  budget_allocated: number
  placement_goal: number
  status: 'draft' | 'active' | 'graduated' | 'archived'
}

export interface CohortReports {
  cohort_id: string
  cohort_name: string
  seat_utilization: {
    target_seats: number
    used_seats: number
    utilization_percentage: number
  }
  completion_metrics: {
    total_enrolled: number
    completed_students: number
    completion_rate: number
    average_completion_percentage: number
  }
  financial_summary: {
    total_cost_kes: number
    total_revenue_kes: number
    net_cost_kes: number
    budget_allocated_kes: number
    budget_utilization_pct: number
  }
  payment_status: {
    paid_invoices: number
    pending_invoices: number
    overdue_invoices: number
    total_invoices: number
  }
}

// =============================================================================
// 💳 Billing & Finance Types
// =============================================================================
export interface BillingCatalog {
  pricing_models: Array<{
    model_type: string
    name: string
    description: string
    price_kes?: number
    percentage?: number
    currency?: string
    billing_cycle: string
    description_detail?: string
  }>
}

export interface CheckoutSession {
  session_id: string
  amount: number
  currency: string
  seats_count: number
  cohort_name: string
  payment_url: string
  expires_at: string
}

export interface SponsorInvoice {
  invoice_id: string
  billing_month: string
  cohort_name: string
  total_amount_kes: number
  revenue_share_kes: number
  net_amount_kes: number
  payment_status: 'pending' | 'paid' | 'overdue'
  payment_date: string | null
  invoice_generated: boolean
  created_at: string
}

export interface SeatEntitlement {
  cohort_id: string
  cohort_name: string
  seats_allocated: number
  seats_used: number
  seats_available: number
  utilization_percentage: number
  track_slug: string
  status: string
}

export interface SponsorReportRequestItem {
  id: string
  request_type: 'graduate_breakdown' | 'roi_projection' | 'cohort_analytics' | 'custom'
  cohort_id: string | null
  cohort_name: string | null
  details: string
  status: 'pending' | 'in_progress' | 'delivered' | 'cancelled'
  created_at: string
  delivered_at: string | null
  attachment_url: string
}

export interface OrganizationMemberItem {
  id: number | string
  organization?: { id: number | string; slug: string; name: string }
  user: { id: number | string; email: string; first_name?: string; last_name?: string }
  role: 'admin' | 'member' | 'viewer'
  joined_at: string
}

// =============================================================================
// 🔒 Privacy & Consent Types
// =============================================================================
export interface StudentConsent {
  student_id: string
  student_name: string
  student_email: string
  consents: Array<{
    scope_type: string
    granted: boolean
    granted_at: string | null
    expires_at: string | null
  }>
}

export interface ConsentCheck {
  student_id: string
  scope_type: string
  has_consent: boolean
  checked_at: string
  reason?: string
}

// =============================================================================
// 📊 Analytics Types
// =============================================================================
export interface SponsorMetrics {
  metric_key: string
  sponsor_id: string
  sponsor_name: string
  data: any
  last_updated: string
}

// Legacy types for backward compatibility
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

/** Legacy aggregate-only shape (e.g. when filtering by consent). */
export interface SponsorStudent {
  student_id: string
  name_anonymized: string
  readiness_score: number | null
  completion_pct: number | null
  portfolio_items: number
  consent_employer_share: boolean
}

/** Sponsored student as returned by GET /sponsor/dashboard/students (from enrollments). */
export interface SponsoredStudentListItem {
  id: string
  name: string
  email: string
  cohort_name: string
  cohort_id: string
  readiness_score?: number | null
  completion_pct?: number | null
  portfolio_items: number
  enrollment_status: string
  consent_employer_share: boolean
}

class SponsorClient {
  // =============================================================================
  // 🔑 Identity & Organization APIs
  // =============================================================================

  /**
   * Create sponsor account
   */
  async signup(data: SponsorSignupData): Promise<{
    user_id: string
    sponsor_id: string
    organization_id: string
    message: string
  }> {
    return apiGateway.post('/auth/signup/', data)
  }

  /**
   * Get sponsor profile
   */
  async getProfile(): Promise<SponsorProfile> {
    return apiGateway.get('/auth/me/')
  }

  /**
   * List organization members (team) for a sponsor org.
   */
  async getTeamMembers(orgSlug: string): Promise<OrganizationMemberItem[]> {
    const res = await apiGateway.get<OrganizationMemberItem[] | { results: OrganizationMemberItem[] }>('/organization-members/', {
      params: { org_slug: orgSlug },
    })
    if (Array.isArray(res)) return res
    if (res && typeof res === 'object' && 'results' in res && Array.isArray(res.results)) return res.results
    return []
  }

  /**
   * Invite a team member to the sponsor organization (sends email via MAIL_* config).
   */
  async inviteTeamMember(data: {
    org_slug: string
    email: string
    org_role: 'admin' | 'member' | 'viewer'
    system_role?: string
  }): Promise<OrganizationMemberItem> {
    return apiGateway.post('/organization-members/invite/', data)
  }

  /**
   * Update consent scopes
   */
  async updateConsent(data: {
    scope_type: string
    granted: boolean
  }): Promise<{
    consent_id: string
    scope_type: string
    granted: boolean
    message: string
  }> {
    return apiGateway.post('/auth/consents/', data)
  }

  // =============================================================================
  // 📚 Program & Cohort Management APIs
  // =============================================================================

  /**
   * Create sponsored cohort
   */
  async createCohort(data: {
    name: string
    track_slug: string
    sponsor_slug: string
    target_size?: number
    start_date?: string
    expected_graduation_date?: string
    budget_allocated?: number
    placement_goal?: number
  }): Promise<{
    cohort_id: string
    name: string
    sponsor: string
    track_slug: string
    message: string
  }> {
    return apiGateway.post('/programs/cohorts/', data)
  }

  /**
   * Enroll sponsored students
   */
  async enrollStudents(cohortId: string, data: {
    student_emails: string[]
  }): Promise<{
    enrolled_students: Array<{
      student_id: string
      email: string
      enrollment_id: string
    }>
    total_enrolled: number
    message: string
  }> {
    return apiGateway.post(`/programs/cohorts/${cohortId}/enrollments/`, data)
  }

  /**
   * List sponsored students in a cohort (sponsor dashboard - programs Cohort)
   */
  async getSponsoredStudents(cohortId: string): Promise<{
    cohort_id: string
    cohort_name: string
    students: Array<{
      enrollment_id: string
      student_id: string
      name: string
      email: string | null
      enrollment_status: string
      completion_percentage: number
      joined_at: string
      last_activity_at: string | null
      has_employer_consent: boolean
    }>
    total_students: number
  }> {
    return apiGateway.get('/sponsor/dashboard/cohort-enrollments', {
      params: { cohort_id: cohortId },
    })
  }

  /**
   * Get cohort reports (sponsor dashboard - programs Cohort)
   */
  async getCohortReports(cohortId: string): Promise<CohortReports> {
    return apiGateway.get('/sponsor/dashboard/cohort-reports', {
      params: { cohort_id: cohortId },
    })
  }

  /**
   * List report requests (sponsor requests for detailed report from director).
   */
  async getReportRequests(): Promise<SponsorReportRequestItem[]> {
    return apiGateway.get('/sponsor/dashboard/report-requests/')
  }

  /**
   * Request a detailed report from the program director.
   */
  async requestDirectorReport(data: {
    request_type: 'graduate_breakdown' | 'roi_projection' | 'cohort_analytics' | 'custom'
    cohort_id?: string
    details?: string
  }): Promise<SponsorReportRequestItem> {
    return apiGateway.post('/sponsor/dashboard/report-requests/', data)
  }

  // =============================================================================
  // 💳 Billing & Finance APIs
  // =============================================================================

  /**
   * Get billing catalog
   */
  async getBillingCatalog(): Promise<BillingCatalog> {
    return apiGateway.get('/billing/catalog/')
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(data: {
    cohort_id: string
    seats_count: number
  }): Promise<CheckoutSession> {
    return apiGateway.post('/billing/checkout/sessions/', data)
  }

  /**
   * Get sponsor invoices
   */
  async getInvoices(): Promise<{
    invoices: SponsorInvoice[]
    total_invoices: number
  }> {
    return apiGateway.get('/billing/invoices/')
  }

  /**
   * Get seat entitlements
   */
  async getEntitlements(): Promise<{
    entitlements: SeatEntitlement[]
    total_cohorts: number
  }> {
    return apiGateway.get('/billing/entitlements/')
  }

  // =============================================================================
  // 📢 Notifications APIs
  // =============================================================================

  /**
   * Send message to sponsored students
   */
  async sendMessage(data: {
    recipient_type: 'cohort' | 'all_students' | 'specific_students'
    subject: string
    message: string
    cohort_id?: string
    student_ids?: string[]
  }): Promise<{
    message_id: string
    recipients_count: number
    status: string
    message: string
  }> {
    return apiGateway.post('/notifications/send/', data)
  }

  // =============================================================================
  // 🔒 Privacy & Consent APIs
  // =============================================================================

  /**
   * Get sponsor-related consents
   */
  async getSponsorConsents(): Promise<{
    consents: StudentConsent[]
    total_students: number
  }> {
    return apiGateway.get('/privacy/consents/my/')
  }

  /**
   * Check student consent
   */
  async checkStudentConsent(data: {
    student_id: string
    scope_type: string
  }): Promise<ConsentCheck> {
    return apiGateway.post('/privacy/check/', data)
  }

  // =============================================================================
  // 📊 Analytics & Reporting APIs
  // =============================================================================

  /**
   * Get sponsor metrics
   */
  async getMetrics(metricKey: 'seat_utilization' | 'completion_rates' | 'placement_metrics' | 'roi_analysis'): Promise<SponsorMetrics> {
    return apiGateway.get(`/analytics/metrics/${metricKey}/`)
  }

  /**
   * Export dashboard PDF
   */
  async exportDashboardPDF(dashboardId: string = 'main-dashboard'): Promise<{
    dashboard_id: string
    sponsor_name: string
    generated_at: string
    pdf_url: string
    expires_at: string
    file_size_bytes: number
    status: string
  }> {
    return apiGateway.get(`/analytics/dashboards/${dashboardId}/pdf/`)
  }

  // =============================================================================
  // Legacy API methods for backward compatibility
  // =============================================================================

  /**
   * Get sponsor dashboard summary (legacy)
   */
  async getSummary(): Promise<SponsorDashboardSummary> {
    return apiGateway.get('/sponsor/dashboard/summary')
  }

  /**
   * Get sponsored cohorts list (legacy)
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
   * Get student aggregates (legacy)
   */
  async getStudents(params?: {
    cohort_id?: string
    readiness_gte?: number
    limit?: number
  }): Promise<SponsoredStudentListItem[]> {
    return apiGateway.get('/sponsor/dashboard/students', { params })
  }

  /**
   * Assign seats to users (legacy)
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
}

export const sponsorClient = new SponsorClient()

