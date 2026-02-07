/**
 * Sponsor/Employer Settings Types
 * Comprehensive settings structure for sponsor accounts
 */

export interface SponsorSettings {
  account: AccountSettings;
  organization: OrganizationSettings;
  billing: BillingSettings;
  team: TeamSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  preferences: PreferencesSettings;
}

export interface AccountSettings {
  email: {
    address: string;
    verified: boolean;
    verifiedAt: string | null;
  };
  phone: {
    number: string | null;
    verified: boolean;
    verifiedAt: string | null;
  };
  password: {
    lastChanged: string | null;
    requiresChange: boolean;
  };
  mfa: {
    enabled: boolean;
    methods: Array<'totp' | 'sms'>;
    backupCodes: number;
  };
  linkedAccounts: Array<{
    provider: 'google' | 'microsoft' | 'sso';
    email: string;
    connectedAt: string;
  }>;
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    ipAddress: string;
    lastActivity: string;
    isCurrent: boolean;
  }>;
}

export interface OrganizationSettings {
  basic: {
    name: string;
    slug: string;
    sponsorType: 'university' | 'corporate' | 'scholarship';
    logoUrl: string | null;
    website: string | null;
    description: string | null;
  };
  contact: {
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
  };
  branding: {
    primaryColor: string | null;
    secondaryColor: string | null;
    customDomain: string | null;
  };
}

export interface BillingSettings {
  subscription: {
    tier: 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    seatsAllocated: number;
    seatsUsed: number;
    nextBillingDate: string | null;
    billingCycle: 'monthly' | 'annual';
  };
  payment: {
    method: 'card' | 'bank_transfer' | 'invoice';
    cardLast4: string | null;
    cardBrand: string | null;
    cardExpiry: string | null;
  };
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'overdue';
    dueDate: string;
    paidDate: string | null;
  }>;
  usage: {
    currentMonth: {
      seatsUsed: number;
      cost: number;
    };
    lastMonth: {
      seatsUsed: number;
      cost: number;
    };
  };
}

export interface TeamSettings {
  members: Array<{
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'viewer';
    status: 'active' | 'invited' | 'suspended';
    invitedAt: string;
    lastActivity: string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
  }>;
  permissions: {
    canInviteMembers: boolean;
    canManageBilling: boolean;
    canViewReports: boolean;
    canManageCohorts: boolean;
  };
}

export interface PrivacySettings {
  dataSharing: {
    shareWithEmployers: boolean;
    shareWithMentors: boolean;
    shareAnalytics: boolean;
  };
  consent: {
    studentDataAccess: 'full' | 'anonymized' | 'aggregate';
    portfolioAccess: boolean;
    readinessScoreAccess: boolean;
  };
  gdpr: {
    dataExportEnabled: boolean;
    dataRetentionDays: number;
    rightToErasure: boolean;
  };
  auditLog: Array<{
    id: string;
    action: string;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
  }>;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
    categories: {
      cohortUpdates: boolean;
      studentProgress: boolean;
      billing: boolean;
      teamActivity: boolean;
      reports: boolean;
    };
  };
  sms: {
    enabled: boolean;
    urgentOnly: boolean;
    phoneNumber: string | null;
  };
  push: {
    enabled: boolean;
    categories: {
      alerts: boolean;
      updates: boolean;
      reports: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    showBadges: boolean;
  };
}

export interface PreferencesSettings {
  dashboard: {
    layout: 'grid' | 'list';
    defaultView: 'overview' | 'cohorts' | 'students' | 'reports';
    showCharts: boolean;
    itemsPerPage: number;
  };
  reports: {
    defaultFormat: 'pdf' | 'csv' | 'excel';
    includeCharts: boolean;
    autoGenerate: boolean;
    schedule: 'weekly' | 'monthly' | 'quarterly' | null;
  };
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currency: string;
}

