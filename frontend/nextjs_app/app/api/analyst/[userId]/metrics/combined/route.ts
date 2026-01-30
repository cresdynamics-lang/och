import { NextRequest, NextResponse } from 'next/server';

// Mock functions to simulate data from 12 different sources
const fetchCurriculumProgress = async (userId: string) => {
  // Simulate API call to curriculum service
  await new Promise(resolve => setTimeout(resolve, 50));
  return { progress: 68, completedModules: 12, totalModules: 18 };
};

const fetchLabMetrics = async (userId: string) => {
  // Simulate API call to lab/metrics service
  await new Promise(resolve => setTimeout(resolve, 30));
  return { mttr: 18, accuracy: 91, alertsProcessed: 47 };
};

const fetchTalentScopeReadiness = async (userId: string) => {
  // Simulate API call to AI talent scope service
  await new Promise(resolve => setTimeout(resolve, 80));
  return { score: 82, level: 'SOC L1 Ready', confidence: 0.94 };
};

const fetchCareerMatches = async (userId: string) => {
  // Simulate API call to career matching service
  await new Promise(resolve => setTimeout(resolve, 40));
  return { activeMatches: 3, topMatchScore: 92, appliedCount: 1 };
};

const fetchCommunityEngagement = async (userId: string) => {
  // Simulate API call to community service
  await new Promise(resolve => setTimeout(resolve, 25));
  return { upvotes: 12, posts: 8, reputation: 156 };
};

const fetchMissionCompletion = async (userId: string) => {
  // Simulate API call to missions service
  await new Promise(resolve => setTimeout(resolve, 35));
  return { completed: 18, total: 23, streak: 7 };
};

const fetchCohortMetrics = async (userId: string) => {
  // Simulate API call to cohort analytics
  await new Promise(resolve => setTimeout(resolve, 60));
  return {
    userRank: 3,
    totalUsers: 127,
    averageReadiness: 78,
    percentile: 76
  };
};

const fetchSponsorROI = async (cohortId: string) => {
  // Simulate API call to sponsor ROI tracking
  await new Promise(resolve => setTimeout(resolve, 45));
  return { totalValue: 3200000, perStudent: 25200 };
};

const fetchSubscriptionStatus = async (userId: string) => {
  // Simulate API call to subscription service
  await new Promise(resolve => setTimeout(resolve, 20));
  return { tier: 'Pro7', status: 'Active', features: ['Advanced Analytics', 'Priority Support'] };
};

const fetchPortfolioViews = async (userId: string) => {
  // Simulate API call to portfolio service
  await new Promise(resolve => setTimeout(resolve, 30));
  return { weeklyViews: 47, totalViews: 234, engagement: 0.68 };
};

const fetchPaymentStatus = async (userId: string) => {
  // Simulate API call to payment service
  await new Promise(resolve => setTimeout(resolve, 25));
  return { status: 'Active', lastPayment: '2026-01-15', nextDue: '2026-02-15' };
};

const fetchAuditLogs = async (userId: string) => {
  // Simulate API call to audit service
  await new Promise(resolve => setTimeout(resolve, 40));
  return { recentActions: 147, lastActivity: '2026-01-29T14:30:00Z' };
};

// Cross-correlation engine for SOC metrics
const calculateTrends = (sources: any) => {
  // Generate realistic 7-day trend data based on current performance
  const baseReadiness = sources.readiness?.score || 75;
  const baseLabPerformance = sources.lab?.accuracy || 85;
  const baseCareerMatches = sources.career?.activeMatches || 2;

  const trends = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const dayVariation = (Math.random() - 0.5) * 10; // ±5% daily variation
    const readiness = Math.max(0, Math.min(100, baseReadiness + dayVariation + (i * 0.5))); // Gradual improvement
    const alertsHandled = Math.max(0, Math.floor(baseLabPerformance * (0.8 + Math.random() * 0.4))); // 80-120% of base

    trends.push({
      day: days[i],
      readiness: Math.round(readiness),
      alertsHandled,
      labPerformance: Math.round(baseLabPerformance + (Math.random() - 0.5) * 5),
      careerMatches: Math.max(0, baseCareerMatches + Math.floor((Math.random() - 0.3) * 3))
    });
  }

  return trends;
};

const calculateCohortPercentile = (userId: string, readinessScore: number, cohortData: any) => {
  // Simulate percentile calculation
  if (readinessScore >= 85) return 90;
  if (readinessScore >= 80) return 76;
  if (readinessScore >= 75) return 65;
  return 45;
};

// Redis cache simulation (in production, use actual Redis client)
const metricsCache = new Map<string, { data: any; timestamp: number }>();

const CACHE_TTL = 60 * 1000; // 1 minute TTL

async function getCachedMetrics(userId: string) {
  const cacheKey = `metrics:${userId}`;
  const cached = metricsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  return null;
}

async function setCachedMetrics(userId: string, data: any) {
  const cacheKey = `metrics:${userId}`;
  metricsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check Redis cache first
    const cachedData = await getCachedMetrics(params.userId);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: Math.round((Date.now() - cachedData._cacheTimestamp) / 1000)
      });
    }

    // Fetch data from all 12 sources in parallel
    const [
      curriculum,
      lab,
      readiness,
      career,
      community,
      missions,
      cohort,
      sponsor,
      subscription,
      portfolio,
      payments,
      audit
    ] = await Promise.all([
      fetchCurriculumProgress(params.userId),
      fetchLabMetrics(params.userId),
      fetchTalentScopeReadiness(params.userId),
      fetchCareerMatches(params.userId),
      fetchCommunityEngagement(params.userId),
      fetchMissionCompletion(params.userId),
      fetchCohortMetrics(params.userId),
      fetchSponsorROI('nairobi-poly-2026'), // Fixed cohort ID for demo
      fetchSubscriptionStatus(params.userId),
      fetchPortfolioViews(params.userId),
      fetchPaymentStatus(params.userId),
      fetchAuditLogs(params.userId)
    ]);

    // Cross-correlate data for unified metrics
    const trendData = calculateTrends({
      curriculum,
      lab,
      readiness,
      career,
      community,
      missions
    });

    const cohortRank = cohort.userRank;
    const cohortTotal = cohort.totalUsers;

    // Calculate final readiness score with cross-correlation
    const readinessScore = Math.min(100, Math.max(0,
      (readiness.score * 0.4) + // AI assessment (40%)
      (curriculum.progress * 0.25) + // Learning progress (25%)
      (lab.accuracy * 0.2) + // Lab performance (20%)
      (missions.completed / missions.total * 100 * 0.15) // Mission completion (15%)
    ));

    // Generate 7-day performance trend summary
    const performanceTrend = trendData.map(day => ({
      metric: day.day,
      change: day.readiness,
      readiness: day.readiness,
      alertsHandled: day.alertsHandled
    }));

    const response = {
      readiness: Math.round(readinessScore),
      mttr: lab.mttr,
      accuracy: lab.accuracy,
      cohortRank,
      cohortTotal,
      trend: performanceTrend, // 7-day trend data for charts
      trends: trendData, // Detailed trend data
      _cacheTimestamp: Date.now(),
      // Include source data for debugging/transparency
      sources: {
        curriculum,
        lab,
        readiness,
        career,
        community,
        missions,
        cohort,
        sponsor,
        subscription,
        portfolio,
        payments,
        audit
      }
    };

    // Cache the response for 1 minute
    await setCachedMetrics(params.userId, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error aggregating metrics from 12 data sources:', error);

    // Try to return cached data if available, even if stale
    const staleData = await getCachedMetrics(params.userId);
    if (staleData) {
      return NextResponse.json({
        ...staleData,
        cached: true,
        stale: true,
        error: 'Using cached data due to service unavailability'
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to aggregate metrics from data sources',
        details: 'One or more data sources may be temporarily unavailable'
      },
      { status: 500 }
    );
  }
}
