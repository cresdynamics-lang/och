/**
 * Marketplace API Client
 * Handles employer-talent interactions, job postings, and marketplace profiles
 */

import { apiGateway } from './apiGateway'

export interface MarketplaceProfile {
  id: string
  mentee_id: string
  mentee_name: string
  mentee_email: string
  tier: 'free' | 'starter' | 'professional'
  readiness_score: number | null
  job_fit_score: number | null
  hiring_timeline_days: number | null
  profile_status: 'foundation_mode' | 'emerging_talent' | 'job_ready'
  primary_role: string | null
  primary_track_key: string | null
  skills: string[]
  portfolio_depth: 'basic' | 'moderate' | 'deep'
  is_visible: boolean
  employer_share_consent: boolean
  updated_at: string
}

export interface Employer {
  id: string
  user_id: string
  company_name: string
  website: string | null
  sector: string | null
  country: string | null
  logo_url: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface JobPosting {
  id: string
  employer_id?: string
  employer?: Employer
  title: string
  description: string
  location: string | null
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  required_skills: string[]
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  is_active: boolean
  application_deadline: string | null
  posted_at: string
  match_score?: number
  has_applied?: boolean
}

export interface JobApplication {
  id: string
  job_posting: JobPosting
  applicant: string
  applicant_name?: string
  applicant_email?: string
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected' | 'withdrawn' | 'accepted'
  cover_letter: string
  match_score: number | null
  notes: string
  applied_at: string
  updated_at: string
  status_changed_at: string | null
}

type PaginatedResult<T> = {
  results: T[]
  count?: number
  page?: number
  page_size?: number
}

export interface EmployerInterestLog {
  id: string
  employer_id: string
  employer?: Employer | null
  profile_id: string
  profile: MarketplaceProfile
  action: 'view' | 'favorite' | 'shortlist' | 'contact_request'
  metadata: Record<string, any>
  message?: string
  subject?: string
  created_at: string
}

export interface TalentBrowseParams {
  contactable_only?: boolean
  status?: 'foundation_mode' | 'emerging_talent' | 'job_ready'
  min_readiness?: number
  skills?: string[]
  q?: string
  page?: number
  page_size?: number
}

export const marketplaceClient = {
  /**
   * Browse talent (employers only)
   */
  async browseTalent(params?: TalentBrowseParams): Promise<{
    results: MarketplaceProfile[]
    count: number
    page: number
    page_size: number
  }> {
    const queryParams = new URLSearchParams()
    if (params?.contactable_only) queryParams.append('contactable_only', 'true')
    if (params?.status) queryParams.append('status', params.status)
    if (params?.min_readiness) queryParams.append('min_readiness', params.min_readiness.toString())
    if (params?.skills && params.skills.length > 0) {
      queryParams.append('skills', params.skills.join(','))
    }
    if (params?.q) queryParams.append('q', params.q)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())

    const queryString = queryParams.toString()
    const url = `/marketplace/talent${queryString ? `?${queryString}` : ''}`
    return apiGateway.get(url)
  },

  /**
   * Get marketplace profile for current user (mentee)
   */
  async getMyProfile(): Promise<MarketplaceProfile> {
    return apiGateway.get('/marketplace/profile/me')
  },

  /**
   * Update marketplace profile visibility (mentee)
   */
  async updateProfileVisibility(isVisible: boolean): Promise<MarketplaceProfile> {
    return apiGateway.patch('/marketplace/profile/me', {
      is_visible: isVisible,
    })
  },

  /**
   * Log employer interest in a talent profile
   */
  async logInterest(profileId: string, action: 'view' | 'favorite' | 'shortlist' | 'contact_request', metadata?: Record<string, any>): Promise<EmployerInterestLog> {
    return apiGateway.post('/marketplace/interest', {
      profile_id: profileId,
      action,
      metadata: metadata || {},
    })
  },

  /**
   * Get employer's interest logs (favorites, shortlists, contact requests)
   */
  async getInterestLogs(action?: 'favorite' | 'shortlist' | 'contact_request'): Promise<EmployerInterestLog[] | PaginatedResult<EmployerInterestLog>> {
    const params = action ? { action } : {}
    return apiGateway.get('/marketplace/interest/list', { params })
  },

  /**
   * Get contact requests received by student
   */
  async getContactRequests(): Promise<EmployerInterestLog[] | PaginatedResult<EmployerInterestLog>> {
    return apiGateway.get('/marketplace/contacts')
  },

  /**
   * Get job postings for current employer
   */
  async getJobPostings(): Promise<JobPosting[] | PaginatedResult<JobPosting>> {
    return apiGateway.get('/marketplace/jobs')
  },

  /**
   * Create a new job posting
   */
  async createJobPosting(data: {
    title: string
    description: string
    location?: string
    job_type: 'full_time' | 'part_time' | 'contract' | 'internship'
    required_skills: string[]
    salary_min?: number
    salary_max?: number
    salary_currency?: string
    application_deadline?: string
  }): Promise<JobPosting> {
    return apiGateway.post('/marketplace/jobs', data)
  },

  /**
   * Update a job posting
   */
  async updateJobPosting(jobId: string, data: Partial<JobPosting>): Promise<JobPosting> {
    return apiGateway.patch(`/marketplace/jobs/${jobId}`, data)
  },

  /**
   * Delete a job posting
   */
  async deleteJobPosting(jobId: string): Promise<void> {
    return apiGateway.delete(`/marketplace/jobs/${jobId}`)
  },

  /**
   * Get employer profile for current user
   */
  async getEmployerProfile(): Promise<Employer> {
    return apiGateway.get('/marketplace/employer/me')
  },

  /**
   * Create or update employer profile
   */
  async updateEmployerProfile(data: {
    company_name: string
    website?: string
    sector?: string
    country?: string
    logo_url?: string
    description?: string
  }): Promise<Employer> {
    return apiGateway.post('/marketplace/employer/me', data)
  },

  // Student job browsing methods
  /**
   * Browse jobs as a student (with match scores)
   */
  async browseJobs(params?: {
    job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
    min_match_score?: number
  }): Promise<JobPosting[]> {
    const queryParams = new URLSearchParams()
    if (params?.job_type) queryParams.append('job_type', params.job_type)
    if (params?.min_match_score) queryParams.append('min_match_score', params.min_match_score.toString())

    const queryString = queryParams.toString()
    const url = `/marketplace/jobs/browse${queryString ? `?${queryString}` : ''}`
    return apiGateway.get(url)
  },

  /**
   * Get job details with match score
   */
  async getJobDetails(jobId: string): Promise<JobPosting> {
    return apiGateway.get(`/marketplace/jobs/${jobId}/detail`)
  },

  /**
   * Apply to a job
   */
  async applyToJob(jobId: string, coverLetter?: string): Promise<JobApplication> {
    return apiGateway.post(`/marketplace/jobs/${jobId}/apply`, {
      job_posting: jobId,
      cover_letter: coverLetter || '',
    })
  },

  /**
   * Get student's job applications
   */
  async getMyApplications(): Promise<JobApplication[]> {
    return apiGateway.get('/marketplace/applications')
  },

  /**
   * Get application details
   */
  async getApplicationDetails(applicationId: string): Promise<JobApplication> {
    return apiGateway.get(`/marketplace/applications/${applicationId}`)
  },

  // Employer application management methods
  /**
   * Get applications for a specific job (employer only)
   */
  async getJobApplications(jobId: string): Promise<JobApplication[] | PaginatedResult<JobApplication>> {
    return apiGateway.get(`/marketplace/jobs/${jobId}/applications`)
  },

  /**
   * Get all applications across all jobs (employer only)
   */
  async getAllApplications(): Promise<{
    results: JobApplication[]
    stats?: Record<string, number>
  }> {
    return apiGateway.get('/marketplace/applications/employer')
  },

  /**
   * Get application details (employer view)
   */
  async getApplicationDetailsEmployer(applicationId: string): Promise<JobApplication> {
    return apiGateway.get(`/marketplace/applications/${applicationId}/employer`)
  },

  /**
   * Update application status (employer only)
   */
  async updateApplicationStatus(applicationId: string, status: JobApplication['status']): Promise<JobApplication> {
    return apiGateway.patch(`/marketplace/applications/${applicationId}/status`, { status })
  },

  /**
   * Update application (status and notes) (employer only)
   */
  async updateApplication(applicationId: string, data: {
    status?: JobApplication['status']
    notes?: string
  }): Promise<JobApplication> {
    return apiGateway.patch(`/marketplace/applications/${applicationId}/employer`, data)
  },

  // Admin marketplace management methods
  /**
   * Admin: List all employers
   */
  async adminListEmployers(params?: {
    search?: string
    country?: string
    sector?: string
    page?: number
    page_size?: number
  }): Promise<{
    results: Employer[]
    count: number
  }> {
    return apiGateway.get('/admin/marketplace/employers/', { params })
  },

  /**
   * Admin: Get employer details
   */
  async adminGetEmployer(employerId: string): Promise<Employer> {
    return apiGateway.get(`/admin/marketplace/employers/${employerId}/`)
  },

  /**
   * Admin: Create employer (onboarding)
   */
  async adminCreateEmployer(data: {
    user_email: string
    company_name: string
    website?: string
    sector?: string
    country?: string
    logo_url?: string
    description?: string
  }): Promise<Employer> {
    return apiGateway.post('/admin/marketplace/employers/', data)
  },

  /**
   * Admin: Update employer
   */
  async adminUpdateEmployer(employerId: string, data: Partial<Employer>): Promise<Employer> {
    return apiGateway.patch(`/admin/marketplace/employers/${employerId}/`, data)
  },

  /**
   * Admin: Suspend employer account
   */
  async adminSuspendEmployer(employerId: string, reason?: string): Promise<{ detail: string; employer: Employer }> {
    return apiGateway.post(`/admin/marketplace/employers/${employerId}/suspend/`, { reason })
  },

  /**
   * Admin: Unsuspend employer account
   */
  async adminUnsuspendEmployer(employerId: string): Promise<{ detail: string; employer: Employer }> {
    return apiGateway.post(`/admin/marketplace/employers/${employerId}/unsuspend/`)
  },

  /**
   * Admin: Assign employer admin role to user
   */
  async adminAssignEmployerAdmin(employerId: string, userEmail: string): Promise<{
    detail: string
    user_role: {
      id: number
      user: string
      role: string
      scope: string
      scope_ref: string
    }
  }> {
    return apiGateway.post(`/admin/marketplace/employers/${employerId}/assign-admin/`, { user_email: userEmail })
  },

  /**
   * Admin: List all marketplace profiles
   */
  async adminListProfiles(params?: {
    status?: 'foundation_mode' | 'emerging_talent' | 'job_ready'
    tier?: 'free' | 'starter' | 'professional'
    is_visible?: boolean
    search?: string
    min_readiness?: number
    page?: number
    page_size?: number
  }): Promise<{
    results: MarketplaceProfile[]
    count: number
  }> {
    return apiGateway.get('/admin/marketplace/profiles/', { params })
  },

  /**
   * Admin: Get marketplace profile details
   */
  async adminGetProfile(profileId: string): Promise<MarketplaceProfile> {
    return apiGateway.get(`/admin/marketplace/profiles/${profileId}/`)
  },

  /**
   * Admin: Update marketplace profile (status, visibility, etc.)
   */
  async adminUpdateProfile(profileId: string, data: {
    profile_status?: 'foundation_mode' | 'emerging_talent' | 'job_ready'
    is_visible?: boolean
  }): Promise<MarketplaceProfile> {
    return apiGateway.patch(`/admin/marketplace/profiles/${profileId}/`, data)
  },

  /**
   * Admin: List all job postings
   */
  async adminListJobs(params?: {
    is_active?: boolean
    employer_id?: string
    search?: string
    page?: number
    page_size?: number
  }): Promise<{
    results: JobPosting[]
    count: number
  }> {
    return apiGateway.get('/admin/marketplace/jobs/', { params })
  },

  /**
   * Admin: Get job posting details
   */
  async adminGetJob(jobId: string): Promise<JobPosting> {
    return apiGateway.get(`/admin/marketplace/jobs/${jobId}/`)
  },

  /**
   * Admin: Update job posting (moderation)
   */
  async adminUpdateJob(jobId: string, data: Partial<JobPosting>): Promise<JobPosting> {
    return apiGateway.patch(`/admin/marketplace/jobs/${jobId}/`, data)
  },

  /**
   * Admin: Approve job posting
   */
  async adminApproveJob(jobId: string): Promise<{ detail: string; job: JobPosting }> {
    return apiGateway.post(`/admin/marketplace/jobs/${jobId}/approve/`)
  },

  /**
   * Admin: Reject job posting
   */
  async adminRejectJob(jobId: string, reason?: string): Promise<{ detail: string; job: JobPosting }> {
    return apiGateway.post(`/admin/marketplace/jobs/${jobId}/reject/`, { reason })
  },

  /**
   * Admin: Delete job posting
   */
  async adminDeleteJob(jobId: string): Promise<void> {
    return apiGateway.delete(`/admin/marketplace/jobs/${jobId}/`)
  },

  /**
   * Admin: List interest logs
   */
  async adminListInterestLogs(params?: {
    action?: 'view' | 'favorite' | 'shortlist' | 'contact_request'
    employer_id?: string
    profile_id?: string
    date_from?: string
    date_to?: string
    page?: number
    page_size?: number
  }): Promise<{
    results: EmployerInterestLog[]
    count: number
  }> {
    return apiGateway.get('/admin/marketplace/interest-logs/', { params })
  },

  /**
   * Admin: Get interest log details
   */
  async adminGetInterestLog(logId: string): Promise<EmployerInterestLog> {
    return apiGateway.get(`/admin/marketplace/interest-logs/${logId}/`)
  },

  /**
   * Admin: Get interest log statistics
   */
  async adminGetInterestLogStats(params?: {
    action?: string
    employer_id?: string
    profile_id?: string
    date_from?: string
    date_to?: string
  }): Promise<{
    action_counts: Array<{ action: string; count: number }>
    daily_counts: Array<{ date: string; count: number }>
    top_employers: Array<{ employer__company_name: string; count: number }>
    top_profiles: Array<{ profile__mentee__email: string; count: number }>
    total_logs: number
  }> {
    return apiGateway.get('/admin/marketplace/interest-logs/stats/', { params })
  },

  /**
   * Admin: Get marketplace analytics
   */
  async adminGetAnalytics(): Promise<{
    profiles: {
      total: number
      visible: number
      by_status: Array<{ profile_status: string; count: number }>
      by_tier: Array<{ tier: string; count: number }>
      avg_readiness: number
      job_ready_count: number
    }
    employers: {
      total: number
      active: number
    }
    jobs: {
      total: number
      active: number
      by_type: Array<{ job_type: string; count: number }>
    }
    applications: {
      total: number
      by_status: Array<{ status: string; count: number }>
    }
    interest_logs: {
      total: number
      by_action: Array<{ action: string; count: number }>
    }
    recent_activity: {
      profiles_created: number
      jobs_posted: number
      applications: number
      interest_logs: number
    }
    time_series?: {
      daily_activity: Array<{
        date: string
        profiles_created: number
        jobs_posted: number
        applications: number
        interest_logs: number
      }>
    }
    readiness_distribution?: Array<{
      range: string
      count: number
    }>
  }> {
    return apiGateway.get('/admin/marketplace/analytics/')
  },

  /**
   * Admin: Get marketplace settings
   */
  async adminGetSettings(): Promise<{
    visibility_rules: {
      free_tier_can_contact: boolean
      starter_tier_can_contact: boolean
      professional_tier_can_contact: boolean
      min_readiness_for_visibility: number
    }
    profile_requirements: {
      min_portfolio_items: number
      min_readiness_for_job_ready: number
    }
    job_posting_rules: {
      require_approval: boolean
      auto_approve: boolean
    }
  }> {
    return apiGateway.get('/admin/marketplace/settings/')
  },

  /**
   * Admin: Update marketplace settings
   */
  async adminUpdateSettings(settings: {
    visibility_rules?: {
      free_tier_can_contact?: boolean
      starter_tier_can_contact?: boolean
      professional_tier_can_contact?: boolean
      min_readiness_for_visibility?: number
    }
    profile_requirements?: {
      min_portfolio_items?: number
      min_readiness_for_job_ready?: number
    }
    job_posting_rules?: {
      require_approval?: boolean
      auto_approve?: boolean
    }
  }): Promise<{ detail: string; settings: any }> {
    return apiGateway.patch('/admin/marketplace/settings/', settings)
  },
}

