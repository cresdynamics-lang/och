import { NextRequest, NextResponse } from 'next/server';
import type { SponsorSettings } from '@/types/sponsor-settings';

function getMockSettings(): SponsorSettings {
  return {
    account: {
      email: {
        address: 'sponsor@och.com',
        verified: true,
        verifiedAt: new Date().toISOString(),
      },
      phone: {
        number: null,
        verified: false,
        verifiedAt: null,
      },
      password: {
        lastChanged: new Date().toISOString(),
        requiresChange: false,
      },
      mfa: {
        enabled: false,
        methods: [],
        backupCodes: 0,
      },
      linkedAccounts: [],
      sessions: [
        {
          id: 'session-1',
          device: 'Desktop - Chrome',
          location: 'Gaborone, Botswana',
          ipAddress: '192.168.1.1',
          lastActivity: new Date().toISOString(),
          isCurrent: true,
        },
      ],
    },
    organization: {
      basic: {
        name: 'OCH Sponsor Organization',
        slug: 'och-sponsor',
        sponsorType: 'corporate',
        logoUrl: null,
        website: null,
        description: null,
      },
      contact: {
        email: 'sponsor@och.com',
        phone: null,
        address: null,
        city: 'Gaborone',
        region: null,
        country: 'BW',
      },
      branding: {
        primaryColor: null,
        secondaryColor: null,
        customDomain: null,
      },
    },
    billing: {
      subscription: {
        tier: 'professional',
        status: 'active',
        seatsAllocated: 50,
        seatsUsed: 35,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        billingCycle: 'monthly',
      },
      payment: {
        method: 'card',
        cardLast4: null,
        cardBrand: null,
        cardExpiry: null,
      },
      invoices: [],
      usage: {
        currentMonth: {
          seatsUsed: 35,
          cost: 10500,
        },
        lastMonth: {
          seatsUsed: 32,
          cost: 9600,
        },
      },
    },
    team: {
      members: [],
      invitations: [],
      permissions: {
        canInviteMembers: true,
        canManageBilling: true,
        canViewReports: true,
        canManageCohorts: true,
      },
    },
    privacy: {
      dataSharing: {
        shareWithEmployers: true,
        shareWithMentors: false,
        shareAnalytics: true,
      },
      consent: {
        studentDataAccess: 'anonymized',
        portfolioAccess: true,
        readinessScoreAccess: true,
      },
      gdpr: {
        dataExportEnabled: true,
        dataRetentionDays: 365,
        rightToErasure: true,
      },
      auditLog: [],
    },
    notifications: {
      email: {
        enabled: true,
        frequency: 'daily',
        categories: {
          cohortUpdates: true,
          studentProgress: true,
          billing: true,
          teamActivity: true,
          reports: true,
        },
      },
      sms: {
        enabled: false,
        urgentOnly: true,
        phoneNumber: null,
      },
      push: {
        enabled: false,
        categories: {
          alerts: true,
          updates: true,
          reports: false,
        },
      },
      inApp: {
        enabled: true,
        showBadges: true,
      },
    },
    preferences: {
      dashboard: {
        layout: 'grid',
        defaultView: 'overview',
        showCharts: true,
        itemsPerPage: 25,
      },
      reports: {
        defaultFormat: 'pdf',
        includeCharts: true,
        autoGenerate: false,
        schedule: null,
      },
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currency: 'BWP',
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    // RBAC Check - would be implemented with proper auth
    // const userRole = 'sponsor_admin';
    // if (userRole !== 'sponsor_admin' && userRole !== 'sponsor') {
    //   return NextResponse.json(
    //     { error: 'Access denied' },
    //     { status: 403 }
    //   );
    // }

    const settings = getMockSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // RBAC Check
    // const userRole = 'sponsor_admin';
    // if (userRole !== 'sponsor_admin' && userRole !== 'sponsor') {
    //   return NextResponse.json(
    //     { error: 'Access denied' },
    //     { status: 403 }
    //   );
    // }

    const updates = await request.json();
    const currentSettings = getMockSettings();
    
    // Merge updates
    const updatedSettings = {
      ...currentSettings,
      ...updates,
    };

    // Audit log
    console.log(`AUDIT: ${new Date().toISOString()} - sponsor settings.update`, updates);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

