import { NextRequest, NextResponse } from 'next/server';

// Mock reports data with 12 data source correlation
const getMockReports = (userId: string) => {
  const now = new Date();
  const today6AM = new Date(now);
  today6AM.setHours(6, 0, 0, 0);

  return [
    {
      id: 'daily-digest-2026',
      type: 'daily' as const,
      title: 'Daily Digest - Sarah K.',
      generatedAt: today6AM.toISOString(),
      status: 'ready' as const,
      size: '2.4 MB',
      shareable: false,
      metrics: {
        readiness: 82,
        cohortAvg: 78,
        mttr: 18,
        accuracy: 91
      }
    },
    {
      id: 'weekly-cohort-2026',
      type: 'weekly' as const,
      title: 'Weekly Cohort Summary',
      generatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      status: 'ready' as const,
      size: '8.7 MB',
      shareable: true,
      metrics: {
        readiness: 82,
        cohortAvg: 78,
        sponsorValue: 'KES 3.2M'
      }
    },
    {
      id: 'lab-performance-2026',
      type: 'lab' as const,
      title: 'Lab Performance Report',
      generatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      status: 'ready' as const,
      size: '1.8 MB',
      shareable: false,
      metrics: {
        mttr: 18,
        accuracy: 91
      }
    }
  ];
};

// Mock data correlation from 12 sources
const generateReportData = async (userId: string, type: string) => {
  // Simulate correlation from 12 data sources
  return {
    userId,
    type,
    generatedAt: new Date().toISOString(),
    // Curriculum data
    curriculum: {
      progress: 68,
      completedModules: 12,
      totalModules: 18
    },
    // Lab/SIEM data
    lab: {
      mttr: 18,
      accuracy: 91,
      alertsHandled: 247,
      falsePositives: 12
    },
    // AI Readiness
    aiReadiness: {
      score: 82,
      primaryTrack: 'SOC L1',
      secondaryTracks: ['DevSecOps', 'Cloud Security']
    },
    // Career data
    career: {
      matches: 8,
      interviews: 2,
      offers: 0
    },
    // Community data
    community: {
      posts: 15,
      upvotes: 47,
      collaborations: 3
    },
    // Mission data
    missions: {
      completed: 18,
      total: 23,
      currentStreak: 7
    },
    // Cohort data
    cohort: {
      rank: 3,
      totalStudents: 127,
      percentile: 85,
      avgReadiness: 78
    },
    // Sponsor ROI
    sponsorROI: {
      value: 'KES 3.2M',
      employers: ['MTN', 'Vodacom', 'Ecobank'],
      placements: 12
    },
    // Subscription data
    subscription: {
      tier: 'Pro7',
      features: ['Priority Matching', 'Sponsor Access', 'Advanced Reports']
    },
    // Portfolio data
    portfolio: {
      views: 47,
      weeklyGrowth: 12,
      employerViews: {
        mtn: 8,
        vodacom: 5,
        ecobank: 3
      }
    },
    // Payments data
    payments: {
      totalSpent: 'KES 45,000',
      scholarships: 'KES 15,000',
      roi: 320
    },
    // Audit data
    audit: {
      totalActions: 147,
      lastActivity: new Date().toISOString(),
      riskScore: 'Low'
    }
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // RBAC Check
    const userRole = 'analyst'; // Mock
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const reports = getMockReports(userId);

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
