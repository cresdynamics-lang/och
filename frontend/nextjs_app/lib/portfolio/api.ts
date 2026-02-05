/**
 * Portfolio Engine - Supabase API Operations
 * Complete CRUD operations for portfolio items, reviews, and marketplace
 */

import { createClient } from '@/lib/supabase/client';
import type {
  PortfolioItem,
  PortfolioReview,
  MarketplaceProfile,
  CreatePortfolioItemInput,
  UpdatePortfolioItemInput,
  CreateReviewInput,
  EvidenceFile,
  PortfolioHealthMetrics,
} from './types';

const supabase = createClient();

// ============================================================================
// PORTFOLIO ITEMS
// ============================================================================

export async function getPortfolioItems(userId: string): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapPortfolioItem);
}

export async function getPortfolioItem(itemId: string): Promise<PortfolioItem | null> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return mapPortfolioItem(data);
}

export async function createPortfolioItem(
  userId: string,
  input: CreatePortfolioItemInput
): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      user_id: userId,
      title: input.title,
      summary: input.summary,
      type: input.type,
      mission_id: input.missionId || null,
      visibility: input.visibility || 'private',
      skill_tags: input.skillTags || [],
      evidence_files: input.evidenceFiles || [],
      external_providers: input.externalProviders || {},
      status: 'draft',
      marketplace_views: 0,
      employer_contacts: 0,
    })
    .select()
    .single();

  if (error) throw error;
  
  const portfolioItem = mapPortfolioItem(data);
  
  // Notify mentors and directors (non-blocking)
  import('./coordination').then(({ notifyMentorsAndDirectors }) => {
    notifyMentorsAndDirectors(userId, portfolioItem.id, portfolioItem.title).catch((err) => {
      console.error('Failed to send notifications:', err);
    });
  });
  
  return portfolioItem;
}

export async function updatePortfolioItem(
  itemId: string,
  input: UpdatePortfolioItemInput
): Promise<PortfolioItem> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update({
      ...(input.title && { title: input.title }),
      ...(input.summary && { summary: input.summary }),
      ...(input.visibility && { visibility: input.visibility }),
      ...(input.skillTags && { skill_tags: input.skillTags }),
      ...(input.evidenceFiles && { evidence_files: input.evidenceFiles }),
      ...(input.status && { status: input.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return mapPortfolioItem(data);
}

export async function deletePortfolioItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

export async function incrementMarketplaceViews(itemId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_portfolio_views', {
    item_id: itemId,
  });

  if (error) {
    // Fallback to manual update if RPC doesn't exist
    const { data } = await supabase
      .from('portfolio_items')
      .select('marketplace_views')
      .eq('id', itemId)
      .single();

    if (data) {
      await supabase
        .from('portfolio_items')
        .update({ marketplace_views: (data.marketplace_views || 0) + 1 })
        .eq('id', itemId);
    }
  }
}

// ============================================================================
// PORTFOLIO REVIEWS
// ============================================================================

export async function getPortfolioReviews(itemId: string): Promise<PortfolioReview[]> {
  const { data, error } = await supabase
    .from('portfolio_reviews')
    .select('*')
    .eq('portfolio_item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapPortfolioReview);
}

export async function createPortfolioReview(
  input: CreateReviewInput
): Promise<PortfolioReview> {
  // Calculate total score from rubric scores
  const scores = Object.values(input.rubricScores);
  const totalScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const { data: userData } = await supabase.auth.getUser();
  const reviewerName = userData?.user?.email?.split('@')[0] || 'Mentor';

  const { data, error } = await supabase
    .from('portfolio_reviews')
    .insert({
      portfolio_item_id: input.portfolioItemId,
      reviewer_id: userData?.user?.id || '',
      reviewer_name: reviewerName,
      rubric_scores: input.rubricScores,
      total_score: totalScore,
      comments: input.comments,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Update portfolio item with competency scores and status
  await supabase
    .from('portfolio_items')
    .update({
      competency_scores: input.rubricScores,
      mentor_feedback: input.comments,
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', input.portfolioItemId);

  return mapPortfolioReview(data);
}

export async function approveReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('portfolio_reviews')
    .update({ status: 'approved' })
    .eq('id', reviewId);

  if (error) throw error;
}

// ============================================================================
// MARKETPLACE PROFILES
// ============================================================================

export async function getMarketplaceProfile(
  username: string
): Promise<MarketplaceProfile | null> {
  const { data, error } = await supabase
    .from('marketplace_profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Get featured items
  const featuredItems = data.featured_item_ids
    ? await getPortfolioItemsByIds(data.featured_item_ids)
    : [];

  return {
    ...mapMarketplaceProfile(data),
    featuredItems,
  };
}

export async function getMarketplaceProfileByUserId(
  userId: string
): Promise<MarketplaceProfile | null> {
  const { data, error } = await supabase
    .from('marketplace_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const featuredItems = data.featured_item_ids
    ? await getPortfolioItemsByIds(data.featured_item_ids)
    : [];

  return {
    ...mapMarketplaceProfile(data),
    featuredItems,
  };
}

export async function updateMarketplaceProfile(
  userId: string,
  updates: Partial<MarketplaceProfile>
): Promise<MarketplaceProfile> {
  const { data, error } = await supabase
    .from('marketplace_profiles')
    .update({
      ...(updates.headline && { headline: updates.headline }),
      ...(updates.bio && { bio: updates.bio }),
      ...(updates.avatar && { avatar_url: updates.avatar }),
      ...(updates.isContactEnabled !== undefined && { is_contact_enabled: updates.isContactEnabled }),
      ...(updates.profileStatus && { profile_status: updates.profileStatus }),
      ...(updates.featuredItems && {
        featured_item_ids: updates.featuredItems.map(item => item.id),
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  const featuredItems = data.featured_item_ids
    ? await getPortfolioItemsByIds(data.featured_item_ids)
    : [];

  return {
    ...mapMarketplaceProfile(data),
    featuredItems,
  };
}

export async function incrementMarketplaceProfileViews(username: string): Promise<void> {
  const { error } = await supabase.rpc('increment_marketplace_views', {
    profile_username: username,
  });

  if (error) {
    // Fallback
    const { data } = await supabase
      .from('marketplace_profiles')
      .select('total_views')
      .eq('username', username)
      .single();

    if (data) {
      await supabase
        .from('marketplace_profiles')
        .update({ total_views: (data.total_views || 0) + 1 })
        .eq('username', username);
    }
  }
}

// ============================================================================
// PORTFOLIO HEALTH & METRICS
// ============================================================================

export async function getPortfolioHealthMetrics(
  userId: string
): Promise<PortfolioHealthMetrics> {
  const items = await getPortfolioItems(userId);
  const approvedItems = items.filter(item => item.status === 'approved');
  const pendingReviews = items.filter(item => item.status === 'in_review');

  // Calculate average score
  const allScores = items
    .flatMap(item => Object.values(item.competencyScores))
    .filter(score => score > 0);
  const averageScore = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0;

  // Aggregate skills
  const skillMap = new Map<string, { score: number; count: number }>();
  items.forEach(item => {
    Object.entries(item.competencyScores).forEach(([skill, score]) => {
      const existing = skillMap.get(skill) || { score: 0, count: 0 };
      skillMap.set(skill, {
        score: existing.score + score,
        count: existing.count + 1,
      });
    });
  });

  const topSkills = Array.from(skillMap.entries())
    .map(([skill, data]) => ({
      skill,
      score: data.score / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Calculate health score (0-10)
  const healthScore = calculateHealthScore({
    totalItems: items.length,
    approvedItems: approvedItems.length,
    averageScore,
    topSkillsCount: topSkills.length,
  });

  return {
    totalItems: items.length,
    approvedItems: approvedItems.length,
    pendingReviews: pendingReviews.length,
    averageScore,
    healthScore,
    topSkills,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPortfolioItem(data: any): PortfolioItem {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    summary: data.summary || '',
    type: data.type,
    missionId: data.mission_id,
    status: data.status,
    visibility: data.visibility,
    skillTags: data.skill_tags || [],
    competencyScores: data.competency_scores || {},
    evidenceFiles: data.evidence_files || [],
    externalProviders: data.external_providers || {},
    mentorFeedback: data.mentor_feedback,
    marketplaceViews: data.marketplace_views || 0,
    employerContacts: data.employer_contacts || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    approvedAt: data.approved_at,
    publishedAt: data.published_at,
  };
}

function mapPortfolioReview(data: any): PortfolioReview {
  return {
    id: data.id,
    portfolioItemId: data.portfolio_item_id,
    reviewerId: data.reviewer_id,
    reviewerName: data.reviewer_name,
    rubricScores: data.rubric_scores || {},
    totalScore: data.total_score || 0,
    comments: data.comments || '',
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapMarketplaceProfile(data: any): MarketplaceProfile {
  return {
    id: data.id,
    userId: data.user_id,
    username: data.username,
    headline: data.headline || '',
    bio: data.bio || '',
    avatar: data.avatar_url,
    readinessScore: data.readiness_score || 0,
    portfolioHealth: data.portfolio_health || 0,
    isContactEnabled: data.is_contact_enabled || false,
    profileStatus: data.profile_status || 'foundation',
    featuredItems: [], // Will be populated separately
    skills: {}, // Will be aggregated from items
    totalViews: data.total_views || 0,
    weeklyRankChange: data.weekly_rank_change || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function getPortfolioItemsByIds(itemIds: string[]): Promise<PortfolioItem[]> {
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .in('id', itemIds);

  if (error) throw error;
  return data.map(mapPortfolioItem);
}

function calculateHealthScore(metrics: {
  totalItems: number;
  approvedItems: number;
  averageScore: number;
  topSkillsCount: number;
}): number {
  // Health score calculation (0-10)
  let score = 0;

  // Items count (max 3 points)
  if (metrics.totalItems >= 10) score += 3;
  else if (metrics.totalItems >= 5) score += 2;
  else if (metrics.totalItems >= 1) score += 1;

  // Approval rate (max 3 points)
  const approvalRate = metrics.totalItems > 0
    ? metrics.approvedItems / metrics.totalItems
    : 0;
  score += approvalRate * 3;

  // Average score (max 2 points)
  score += (metrics.averageScore / 10) * 2;

  // Skills diversity (max 2 points)
  if (metrics.topSkillsCount >= 10) score += 2;
  else if (metrics.topSkillsCount >= 5) score += 1.5;
  else if (metrics.topSkillsCount >= 3) score += 1;

  return Math.min(10, Math.round(score * 10) / 10);
}

// Get marketplace rank for a user
export async function getMarketplaceRank(userId: string): Promise<number> {
  // Get user's marketplace profile
  const profile = await getMarketplaceProfileByUserId(userId);
  if (!profile) return 999; // Not ranked if no profile

  // Get all profiles ordered by ranking score
  const { data: profiles, error } = await supabase
    .from('marketplace_profiles')
    .select('user_id, readiness_score, portfolio_health, total_views')
    .order('readiness_score', { ascending: false })
    .order('total_views', { ascending: false });

  if (error || !profiles) return 999;

  // Calculate ranking scores and find user's position
  const rankings = profiles
    .map((p) => ({
      userId: p.user_id,
      score: (p.readiness_score || 0) * 0.4 + (p.portfolio_health || 0) * 10 * 0.3 + (p.total_views || 0) * 0.3,
    }))
    .sort((a, b) => b.score - a.score);

  const userIndex = rankings.findIndex((r) => r.userId === userId);
  return userIndex >= 0 ? userIndex + 1 : 999;
}

// Auto-create portfolio item from mission
export async function createPortfolioItemFromMission(
  userId: string,
  missionId: string,
  files: EvidenceFile[]
): Promise<PortfolioItem> {
  // This would typically fetch mission data from your backend
  // For now, we'll create a basic item
  return createPortfolioItem(userId, {
    title: `Mission Completion`,
    summary: `Portfolio item created from completed mission`,
    type: 'mission',
    missionId,
    visibility: 'marketplace_preview',
    evidenceFiles: files,
  });
}

