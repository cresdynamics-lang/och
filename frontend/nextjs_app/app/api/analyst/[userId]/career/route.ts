import { NextRequest, NextResponse } from 'next/server';
import type { CareerPipeline } from '@/types/analyst-career';

// Mock data for career matches - PII-safe (no contact details)
const getMockCareerData = (userId: string, readiness: number = 82): CareerPipeline => {
  // Simulate RBAC check - only analysts can access
  const userRole = 'analyst'; // Would be fetched from auth/DB
  if (userRole !== 'analyst') {
    throw new Error('Access denied');
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    matches: [
      {
        id: 'mtn-soc-l1-2026',
        company: 'MTN Group',
        position: 'SOC Analyst - Threat Detection',
        matchScore: 92,
        status: 'applied',
        logoUrl: '/logos/mtn.png',
        appliedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Nairobi, Kenya',
        salary: 'KES 180,000 - 250,000',
        deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'ecobank-grc-pro7',
        company: 'Ecobank Group',
        position: 'GRC Analyst - SOC Operations',
        matchScore: 78,
        status: 'available',
        logoUrl: '/logos/ecobank.png',
        location: 'Nairobi, Kenya',
        salary: 'KES 200,000 - 280,000',
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tierRequired: 'pro7',
      },
      {
        id: 'vodacom-interview-urgent',
        company: 'Vodacom Group',
        position: 'Cybersecurity Operations Analyst',
        matchScore: 87,
        status: 'interview',
        logoUrl: '/logos/vodacom.png',
        interviewDate: tomorrow.toISOString(),
        location: 'Nairobi, Kenya',
        salary: 'KES 160,000 - 220,000',
        deadline: tomorrow.toISOString(),
      },
    ],
    portfolio: {
      viewsThisWeek: 47,
      employerViews: 8,
      totalViews: 156,
      weeklyGrowth: 12,
      employerViewsBreakdown: {
        mtn: 8,
        vodacom: 5,
        ecobank: 3,
        kcb: 2,
        equity: 1,
      },
    },
    pipeline: {
      portfolioViews: 47,
      shortlists: 8,
      interviews: 3,
      offers: 1,
    },
    resumeUrl: readiness >= 82 ? `/api/analyst/${userId}/resume/resume-${userId}.pdf` : null,
    resumeExpiry: readiness >= 82 
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null,
    readinessBadge: readiness >= 82 ? 'ready' : readiness >= 70 ? 'almost' : 'building',
  };
};

// Mock audit logging
const logAuditEvent = (userId: string, action: string, metadata?: any) => {
  console.log(`AUDIT: ${new Date().toISOString()} - ${userId} - ${action}`, metadata);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {

    // RBAC Check - would be implemented with proper auth
    const userRole = 'analyst'; // Mock - would come from JWT/auth
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied. Analyst role required.' },
        { status: 403 }
      );
    }

    // Audit log access
    logAuditEvent(userId, 'career.view', { endpoint: 'career' });

    // Mock readiness score (would come from user profile/metrics)
    const readiness = 82; // Would fetch from metrics API

    const careerData = getMockCareerData(userId, readiness);

    return NextResponse.json(careerData);

  } catch (error) {
    console.error('Career API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

    // Mock 1-click apply endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { matchId, autoIncludePortfolio } = await request.json();

    // RBAC Check
    const userRole = 'analyst';
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Audit log application
    logAuditEvent(userId, 'career.apply', {
      matchId,
      autoIncludePortfolio,
      timestamp: new Date().toISOString()
    });

    // Mock application processing
    // In real implementation:
    // 1. Fetch user portfolio/resume
    // 2. Generate application package
    // 3. Send to employer via API/email
    // 4. Update application status

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      applicationId: `app-${Date.now()}`,
      status: 'applied',
      message: 'Application submitted successfully',
    });

  } catch (error: any) {
    const { userId } = await params;
    console.error('Career apply error:', error);
    logAuditEvent(userId, 'career.apply.error', { error: error?.message || 'Unknown error' });

    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
