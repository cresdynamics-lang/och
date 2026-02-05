/**
 * Portfolio Integrations
 * TalentScope and external platform integrations
 */

import type { PortfolioItem, PortfolioReview } from './types';

const TALENTSCOPE_API_URL = process.env.NEXT_PUBLIC_TALENTSCOPE_API_URL || '';

/**
 * Sync portfolio review scores to TalentScope
 */
export async function syncReviewToTalentScope(
  userId: string,
  review: PortfolioReview,
  item: PortfolioItem
): Promise<void> {
  if (!TALENTSCOPE_API_URL) {
    console.warn('TALENTSCOPE_API_URL not configured');
    return;
  }

  try {
    const response = await fetch(`${TALENTSCOPE_API_URL}/signals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TALENTSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        userId,
        type: 'portfolio_review',
        scores: review.rubricScores,
        totalScore: review.totalScore,
        portfolioItemId: item.id,
        portfolioItemType: item.type,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`TalentScope sync failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to sync to TalentScope:', error);
    throw error;
  }
}

/**
 * Update user readiness score in TalentScope
 */
export async function updateReadinessScore(
  userId: string,
  score: number
): Promise<void> {
  if (!TALENTSCOPE_API_URL) {
    console.warn('TALENTSCOPE_API_URL not configured');
    return;
  }

  try {
    const response = await fetch(`${TALENTSCOPE_API_URL}/users/${userId}/readiness`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TALENTSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        score,
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Readiness score update failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to update readiness score:', error);
    throw error;
  }
}

/**
 * Auto-create portfolio item from mission completion
 */
export async function createPortfolioFromMission(
  userId: string,
  missionId: string,
  missionData: {
    title: string;
    skills: string[];
    evidence: Array<{ url: string; type: string }>;
  }
): Promise<string | null> {
  // This would typically call your backend API
  // For now, return null as placeholder
  console.log('Auto-creating portfolio item from mission:', {
    userId,
    missionId,
    missionData,
  });
  
  return null;
}

