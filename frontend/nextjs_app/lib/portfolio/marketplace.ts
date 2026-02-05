/**
 * Marketplace Ranking Algorithm
 * Calculates rankings based on views, readiness score, and portfolio health
 */

import type { MarketplaceProfile, MarketplaceRanking } from './types';

export interface RankingFactors {
  totalViews: number;
  readinessScore: number;
  portfolioHealth: number;
  approvedItemsCount: number;
  averageScore: number;
  profileAge: number; // Days since profile creation
}

/**
 * Calculate marketplace ranking score (0-100)
 */
export function calculateRankingScore(factors: RankingFactors): number {
  // Normalize each factor to 0-1 scale
  const normalizedViews = Math.min(factors.totalViews / 1000, 1); // Cap at 1000 views
  const normalizedReadiness = factors.readinessScore / 100;
  const normalizedHealth = factors.portfolioHealth / 10;
  const normalizedItems = Math.min(factors.approvedItemsCount / 20, 1); // Cap at 20 items
  const normalizedScore = factors.averageScore / 10;
  const normalizedAge = Math.min(factors.profileAge / 365, 1); // Cap at 1 year

  // Weighted scoring
  const weights = {
    views: 0.15,
    readiness: 0.25,
    health: 0.20,
    items: 0.15,
    score: 0.15,
    age: 0.10, // Bonus for established profiles
  };

  const rankingScore =
    normalizedViews * weights.views +
    normalizedReadiness * weights.readiness +
    normalizedHealth * weights.health +
    normalizedItems * weights.items +
    normalizedScore * weights.score +
    normalizedAge * weights.age;

  return Math.round(rankingScore * 100);
}

/**
 * Rank marketplace profiles
 */
export function rankMarketplaceProfiles(
  profiles: MarketplaceProfile[]
): MarketplaceRanking[] {
  const rankings: MarketplaceRanking[] = profiles.map((profile) => {
    const profileAge = profile.createdAt
      ? Math.floor(
          (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const factors: RankingFactors = {
      totalViews: profile.totalViews,
      readinessScore: profile.readinessScore,
      portfolioHealth: profile.portfolioHealth,
      approvedItemsCount: profile.featuredItems.filter(
        (item) => item.status === 'approved'
      ).length,
      averageScore: calculateAverageScore(profile.featuredItems),
      profileAge,
    };

    const rankingScore = calculateRankingScore(factors);

    return {
      userId: profile.userId,
      username: profile.username,
      readinessScore: profile.readinessScore,
      portfolioHealth: profile.portfolioHealth,
      totalViews: profile.totalViews,
      approvedItemsCount: factors.approvedItemsCount,
      rank: 0, // Will be set after sorting
    };
  });

  // Sort by ranking score (descending) and assign ranks
  rankings.sort((a, b) => {
    const scoreA = calculateRankingScore({
      totalViews: a.totalViews,
      readinessScore: a.readinessScore,
      portfolioHealth: a.portfolioHealth,
      approvedItemsCount: a.approvedItemsCount,
      averageScore: 0, // Would need to calculate
      profileAge: 0, // Would need to calculate
    });
    const scoreB = calculateRankingScore({
      totalViews: b.totalViews,
      readinessScore: b.readinessScore,
      portfolioHealth: b.portfolioHealth,
      approvedItemsCount: b.approvedItemsCount,
      averageScore: 0,
      profileAge: 0,
    });
    return scoreB - scoreA;
  });

  // Assign ranks
  rankings.forEach((ranking, index) => {
    ranking.rank = index + 1;
  });

  return rankings;
}

function calculateAverageScore(items: any[]): number {
  if (items.length === 0) return 0;

  const allScores = items.flatMap((item) =>
    Object.values(item.competencyScores || {}) as number[]
  ) as number[];
  if (allScores.length === 0) return 0;

  return allScores.reduce((a, b) => a + b, 0) / allScores.length;
}

/**
 * Get top ranked profiles
 */
export function getTopRankedProfiles(
  profiles: MarketplaceProfile[],
  limit = 10
): MarketplaceRanking[] {
  const rankings = rankMarketplaceProfiles(profiles);
  return rankings.slice(0, limit);
}

/**
 * Get profile rank
 */
export function getProfileRank(
  profile: MarketplaceProfile,
  allProfiles: MarketplaceProfile[]
): number {
  const rankings = rankMarketplaceProfiles(allProfiles);
  const ranking = rankings.find((r) => r.userId === profile.userId);
  return ranking?.rank || 0;
}

