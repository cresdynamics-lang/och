// Legacy types (kept for backward compatibility)
export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  type: 'full_time' | 'part_time' | 'contract' | 'internship'
  description: string
  required_skills: string[]
  match_score: number // 0-100
  salary_range?: {
    min: number
    max: number
    currency: string
  }
  posted_at: string
  application_deadline?: string
}

export interface Application {
  id: string
  job_id: string
  status: 'draft' | 'submitted' | 'under_review' | 'interview' | 'offer' | 'rejected'
  submitted_at?: string
  portfolio_items_used: string[]
  cover_letter?: string
}

export interface EmployerInterest {
  id: string
  employer_name: string
  portfolio_item_id: string
  message?: string
  timestamp: string
  status: 'viewed' | 'interested' | 'contacted'
}

// New marketplace types (from marketplaceClient)
export type {
  MarketplaceProfile,
  Employer,
  JobPosting,
  EmployerInterestLog,
  TalentBrowseParams,
} from '../marketplaceClient'

