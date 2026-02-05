/**
 * Portfolio Engine - TypeScript Type Definitions
 * Complete data models for portfolio items, reviews, and marketplace profiles
 */

export type PortfolioItemType = 
  | 'mission' 
  | 'reflection' 
  | 'certification' 
  | 'github' 
  | 'thm' 
  | 'external' 
  | 'marketplace';

export type PortfolioItemStatus = 
  | 'draft' 
  | 'submitted' 
  | 'in_review' 
  | 'changes_requested' 
  | 'approved' 
  | 'published';

export type PortfolioVisibility = 
  | 'private' 
  | 'unlisted' 
  | 'marketplace_preview' 
  | 'public';

export type ProfileStatus = 
  | 'foundation' 
  | 'emerging' 
  | 'job_ready';

export interface EvidenceFile {
  url: string;
  type: 'pdf' | 'image' | 'video' | 'link';
  thumbnail?: string;
  size: number;
  name?: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  summary: string;
  type: PortfolioItemType;
  missionId?: string;
  status: PortfolioItemStatus;
  visibility: PortfolioVisibility;
  skillTags: string[];
  competencyScores: Record<string, number>; // {"siem": 8.5, "dfir": 9.2}
  evidenceFiles: EvidenceFile[];
  externalProviders?: Record<string, any>; // GitHub repo metadata, THM profile, etc.
  mentorFeedback?: string;
  marketplaceViews: number;
  employerContacts: number; // NEW: Count of employer contact attempts
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
}

export interface PortfolioReview {
  id: string;
  portfolioItemId: string;
  reviewerId: string;
  reviewerName: string;
  rubricScores: Record<string, number>;
  totalScore: number; // 0-10
  comments: string;
  status: 'pending' | 'approved' | 'changes_requested';
  createdAt: string;
  updatedAt?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, for weighted scoring
}

export interface Rubric {
  id: string;
  name: string;
  itemType: PortfolioItemType;
  criteria: RubricCriterion[];
}

export interface MarketplaceProfile {
  id: string;
  userId: string;
  username: string;
  headline: string;
  bio: string;
  avatar?: string;
  readinessScore: number; // 0-100, from TalentScope
  portfolioHealth: number; // 0-10
  isContactEnabled: boolean;
  profileStatus: ProfileStatus;
  featuredItems: PortfolioItem[];
  skills: Record<string, number>; // Aggregated from all portfolio items
  totalViews: number;
  weeklyRankChange: number; // NEW: Ranking change this week
  createdAt: string;
  updatedAt?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'item_created' | 'item_approved' | 'review_received' | 'marketplace_view' | 'contact_received';
  title: string;
  description: string;
  portfolioItemId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface PortfolioHealthMetrics {
  totalItems: number;
  approvedItems: number;
  pendingReviews: number;
  averageScore: number;
  healthScore: number; // 0-10 calculated score
  topSkills: Array<{ skill: string; score: number; count: number }>;
}

export interface CreatePortfolioItemInput {
  title: string;
  summary: string;
  type: PortfolioItemType;
  missionId?: string;
  visibility?: PortfolioVisibility;
  skillTags?: string[];
  evidenceFiles?: EvidenceFile[];
  externalProviders?: Record<string, any>;
}

export interface UpdatePortfolioItemInput {
  title?: string;
  summary?: string;
  visibility?: PortfolioVisibility;
  skillTags?: string[];
  evidenceFiles?: EvidenceFile[];
  status?: PortfolioItemStatus;
}

export interface CreateReviewInput {
  portfolioItemId: string;
  rubricScores: Record<string, number>;
  comments: string;
}

export interface MarketplaceRanking {
  userId: string;
  username: string;
  readinessScore: number;
  portfolioHealth: number;
  totalViews: number;
  approvedItemsCount: number;
  rank: number;
}

