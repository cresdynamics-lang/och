import { NextRequest, NextResponse } from 'next/server';
import type { AnalystSettings } from '@/types/analyst-settings';

// Mock data generator for analyst settings
const getMockSettings = (userId: string): AnalystSettings => {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    account: {
      email: {
        primary: 'primary@trainee.com',
        verified: true,
        verificationDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      phone: {
        number: '+2547xxxxxxxx',
        verified: true,
        sms2faEnabled: true,
      },
      password: {
        lastChanged: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        strength: 'strong',
      },
      mfa: {
        enabled: false,
        method: null,
      },
      linkedAccounts: {
        google: true,
        whatsappBusiness: true,
      },
      sessions: [
        {
          id: 'session-1',
          device: 'Chrome on Windows',
          location: 'Nairobi, Kenya',
          lastActive: now.toISOString(),
          current: true,
        },
        {
          id: 'session-2',
          device: 'Safari on iPhone',
          location: 'Nairobi, Kenya',
          lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          current: false,
        },
      ],
    },
    profile: {
      personal: {
        name: 'Sarah K.',
        photo: null,
        bio: 'SOC L1 trainee, 82% readiness',
        location: 'Nairobi, KE',
      },
      professional: {
        cohort: 'Nairobi Poly Jan 2026',
        cohortRank: '#3/127',
        track: 'Defender SOC L1',
        trackProgress: 68,
        readiness: 82,
        certifications: [
          {
            id: 'cert-1',
            name: 'SOC Triage',
            issuer: 'OCH',
            date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            badgeUrl: '/badges/soc-triage.png',
          },
        ],
      },
      portfolio: {
        publicProfile: true,
        viewsThisWeek: 47,
        employerShare: [
          { company: 'MTN', enabled: true, views: 8 },
          { company: 'Vodacom', enabled: true, views: 5 },
          { company: 'Ecobank', enabled: false, views: 0 },
        ],
        mentorShare: {
          enabled: true,
          mentorId: 'mentor-123',
          mentorName: 'John M.',
        },
        resumeUrl: '/api/analyst/resume/resume-123.pdf',
        resumeExpiry: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    notifications: {
      channels: {
        email: {
          enabled: true,
          frequency: 'daily',
          categories: {
            dailyDigest: true,
            quizDue: true,
            careerMatch: true,
          },
        },
        sms: {
          enabled: true,
          whatsappBusiness: true,
          categories: {
            urgentAlerts: true,
            mttrBreach: true,
            placement: true,
          },
        },
        push: {
          enabled: true,
          deviceTokens: ['token-1', 'token-2'],
          categories: {
            newMission: true,
            streakBroken: true,
          },
        },
        inApp: {
          enabled: true,
          style: 'banner',
        },
      },
      priorities: {
        critical: ['mttr', 'quiz-overdue'],
        high: ['career-match', 'portfolio-view'],
        low: ['daily-streak', 'video-recommended'],
      },
    },
    privacy: {
      profileVisibility: {
        publicPortfolio: true,
        viewsThisWeek: 47,
        readinessScore: true,
        missionSubmissions: 'mentors',
      },
      dataSharing: {
        employers: [
          { company: 'MTN', enabled: true, scope: 'full', views: 8 },
          { company: 'Vodacom', enabled: true, scope: 'readiness-only', views: 5 },
          { company: 'Ecobank', enabled: false, scope: 'full', views: 0 },
        ],
        mentors: {
          enabled: true,
          currentMentors: [
            { id: 'mentor-123', name: 'John M.', access: 'full' },
          ],
          futureMentors: true,
        },
      },
      gdpr: {
        dataExport: {
          lastExport: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          formats: ['json', 'pdf'],
        },
        analyticsOptOut: false,
        dataRetention: 'forever',
      },
      auditLog: [
        {
          id: 'audit-1',
          action: 'MTN viewed profile',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          details: 'MTN HR viewed full profile',
        },
        {
          id: 'audit-2',
          action: 'Quiz due SMS sent',
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          details: 'Alert Triage quiz reminder sent via SMS',
        },
      ],
    },
    subscription: {
      tier: {
        name: 'pro7',
        displayName: 'Pro7',
        active: true,
        activeUntil: nextMonth.toISOString(),
        price: {
          amount: 10000,
          currency: 'KES',
          period: 'monthly',
        },
      },
      seats: {
        used: 1,
        total: 1,
        upgradeAvailable: true,
      },
      billing: {
        paymentMethod: {
          type: 'card',
          last4: '4242',
          brand: 'visa',
        },
        nextBilling: {
          date: nextMonth.toISOString(),
          amount: 10000,
          currency: 'KES',
        },
        history: [
          {
            id: 'inv-1',
            date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 10000,
            currency: 'KES',
            status: 'paid',
            invoiceUrl: '/api/invoices/inv-1.pdf',
          },
        ],
      },
    },
    preferences: {
      dashboard: {
        layout: 'compact',
        defaultTab: 'lab',
        theme: 'dark',
      },
      workflow: {
        alertUrgency: 'high',
        mttrTarget: 30,
        autoSave: {
          screenshots: true,
          notes: true,
        },
      },
      lab: {
        defaultTool: 'siem',
        alertFilters: ['ryuk', 'phishing'],
      },
      accessibility: {
        highContrast: false,
        screenReader: false,
        keyboardShortcuts: true,
      },
      notifications: {
        sound: 'default',
      },
    },
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // RBAC Check
    const userRole = 'analyst';
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied. Analyst role required.' },
        { status: 403 }
      );
    }

    const settings = getMockSettings(userId);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const updates = await request.json();

    // RBAC Check
    const userRole = 'analyst';
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Mock update - in production, would update database
    const currentSettings = getMockSettings(userId);
    const updatedSettings = {
      ...currentSettings,
      ...updates,
    };

    // Audit log
    console.log(`AUDIT: ${new Date().toISOString()} - ${userId} - settings.update`, updates);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

