/**
 * Sponsor Dashboard Types
 * Types for OCH Sponsor Dashboard API responses and components
 */

export interface Sponsor {
  orgId: string;
  name: string;
  logoUrl?: string;
  totalSponsoredAmount: number;
  currency: string;
}

export interface SponsorSummary {
  totalValueCreated: number;
  totalSeatsSponsored: number;
  seatsUsed: number;
  avgReadiness: number; // 0-1
  placementRate: number; // 0-1
  roiMultiple: number; // e.g. 4.2
}

export interface Cohort {
  cohortId: string;
  name: string;
  institution: string;
  startDate: string;
  endDate?: string;
  seatsSponsored: number;
  seatsUsed: number;
  avgReadiness: number; // 0-1
  readinessTarget: number; // 0-1
  placementRate: number; // 0-1
  applied: number;
  interviewing: number;
  offers: number;
  hired: number;
  riskLevel: 'on_track' | 'warning' | 'at_risk';
}

export interface TopSkill {
  name: string;
  completionRate: number; // 0-1
}

export interface Track {
  trackKey: string; // "defender" | "offensive" | "grc" | "innovation" | "leadership"
  trackName: string;
  avgReadiness: number; // 0-1
  avgTimeToProficiencyDays: number;
}

export interface SkillsData {
  topSkills: TopSkill[];
  tracks: Track[];
}

export interface Partner {
  name: string;
  logoUrl?: string;
  hiresFromThisSponsor: number;
  external?: boolean;
}

export interface EmployerSignals {
  profileViews: number;
  shortlists: number;
  interviews: number;
  offers: number;
  hires: number;
}

export interface EmployersData {
  partners: Partner[];
  signals: EmployerSignals;
}

export interface SponsorActions {
  recommendedSeatIncrease: number;
  atRiskCohorts: string[]; // cohortIds
}

export interface SponsorDashboardResponse {
  sponsor: Sponsor;
  summary: SponsorSummary;
  cohorts: Cohort[];
  skills: SkillsData;
  employers: EmployersData;
  actions: SponsorActions;
}

// Component Props Types
export interface SponsorHeroProps {
  sponsor: Sponsor;
  summary: SponsorSummary;
}

export interface CohortPerformanceProps {
  cohorts: Cohort[];
}

export interface SkillsOutcomesProps {
  skills: SkillsData;
}

export interface EmployerSignalsProps {
  employers: EmployersData;
}

export interface SponsorActionsProps {
  summary: SponsorSummary;
  actions: SponsorActions;
  cohorts: Cohort[];
}

// API Request/Response Types
export interface ExportROIRequest {
  orgId: string;
  format: 'pdf' | 'csv';
}

export interface SupportRequest {
  orgId: string;
  cohortId: string;
  issueType: 'readiness' | 'placement' | 'resources' | 'other';
  description: string;
}

export interface SeatIncreaseRequest {
  orgId: string;
  additionalSeats: number;
  justification: string;
}

export interface HRInvitationRequest {
  orgId: string;
  emails: string[];
  message?: string;
}

// Risk Level Colors and Labels
export const RISK_LEVEL_CONFIG = {
  on_track: {
    color: 'green',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    label: 'On Track'
  },
  warning: {
    color: 'yellow',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    label: 'Warning'
  },
  at_risk: {
    color: 'red',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    label: 'At Risk'
  }
} as const;

// Track Key Mappings
export const TRACK_CONFIG = {
  defender: { name: 'Defender', color: 'blue' },
  offensive: { name: 'Offensive', color: 'red' },
  grc: { name: 'GRC', color: 'green' },
  innovation: { name: 'Innovation', color: 'purple' },
  leadership: { name: 'Leadership', color: 'orange' }
} as const;
