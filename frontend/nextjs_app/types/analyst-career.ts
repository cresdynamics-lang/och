/**
 * Full Career Pipeline Types
 * For career signals, matches, and auto-resume
 */

export type CareerMatchStatus = 'applied' | 'shortlisted' | 'interview' | 'offer' | 'rejected' | 'available';

export interface CareerMatch {
  id: string;
  company: string;
  position: string;
  matchScore: number; // 0-100
  status: CareerMatchStatus;
  logoUrl?: string;
  appliedAt?: string;
  interviewDate?: string;
  location?: string;
  salary?: string;
  deadline?: string;
  tierRequired?: string;
}

export interface CareerPipeline {
  matches: CareerMatch[];
  portfolio: {
    viewsThisWeek: number;
    employerViews: number;
    totalViews: number;
    weeklyGrowth: number;
    employerViewsBreakdown: Record<string, number>;
  };
  pipeline: {
    portfolioViews: number;
    shortlists: number;
    interviews: number;
    offers: number;
  };
  resumeUrl: string | null; // Auto-generated PDF URL
  resumeExpiry: string | null; // ISO date
  readinessBadge: 'ready' | 'almost' | 'building'; // Based on 82%+ readiness
}

export interface ResumeGenerateRequest {
  userId: string;
  includePortfolio?: boolean;
}

export interface ResumeGenerateResponse {
  success: boolean;
  resumeUrl: string;
  expiryDate: string; // ISO date (7 days from now)
  downloadUrl: string;
}

export interface CareerApplyRequest {
  userId: string;
  matchId: string;
  autoIncludePortfolio?: boolean;
}

export interface CareerApplyResponse {
  success: boolean;
  applicationId: string;
  status: CareerMatchStatus;
  message: string;
}

