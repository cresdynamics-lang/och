import { NextRequest, NextResponse } from 'next/server';

// Mock data for career matches - PII-safe (no contact details)
const getMockCareerData = (userId: string) => {
  // Simulate RBAC check - only analysts can access
  const userRole = 'analyst'; // Would be fetched from auth/DB
  if (userRole !== 'analyst') {
    return null; // Access denied
  }

  return {
    matches: [
      {
        id: 'mtn-soc-l1-2026',
        employer: 'MTN Group',
        role: 'SOC Analyst - Threat Detection',
        matchScore: 92,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Feb 2
        status: 'open' as const,
        location: 'Nairobi, Kenya',
        salary: 'KES 180,000 - 250,000'
      },
      {
        id: 'vodacom-interview-urgent',
        employer: 'Vodacom Group',
        role: 'Cybersecurity Operations Analyst',
        matchScore: 87,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'interview' as const,
        location: 'Nairobi, Kenya',
        salary: 'KES 160,000 - 220,000'
      },
      {
        id: 'ecobank-grc-pro7',
        employer: 'Ecobank Group',
        role: 'GRC Analyst - SOC Operations',
        matchScore: 78,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open' as const,
        tierRequired: 'pro7',
        location: 'Nairobi, Kenya',
        salary: 'KES 200,000 - 280,000'
      }
    ],
    portfolio: {
      views: 47,
      weeklyGrowth: 12,
      employerViews: {
        mtn: 8,
        vodacom: 5,
        ecobank: 3,
        kcb: 2,
        equity: 1
      },
      shares: 2
    },
    userTier: 'pro7' // Current user tier
  };
};

// Mock audit logging
const logAuditEvent = (userId: string, action: string, metadata?: any) => {
  console.log(`AUDIT: ${new Date().toISOString()} - ${userId} - ${action}`, metadata);
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

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

    const careerData = getMockCareerData(userId);

    if (!careerData) {
      return NextResponse.json(
        { error: 'Career data not available' },
        { status: 404 }
      );
    }

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
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { jobId, autoIncludePortfolio } = await request.json();

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
      jobId,
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
      message: 'Application submitted successfully',
      applicationId: `app-${Date.now()}`,
      status: 'submitted'
    });

  } catch (error) {
    console.error('Career apply error:', error);
    logAuditEvent(params.userId, 'career.apply.error', { error: error.message });

    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
