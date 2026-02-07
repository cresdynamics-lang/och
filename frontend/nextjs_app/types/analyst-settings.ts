/**
 * Analyst Settings Type Definitions
 * Complete entity specification for SOC L1 trainee settings
 */

// Account Settings
export interface AccountSettings {
  email: {
    primary: string;
    verified: boolean;
    verificationDate?: string;
  };
  phone: {
    number: string;
    verified: boolean;
    sms2faEnabled: boolean;
  };
  password: {
    lastChanged?: string;
    strength?: 'weak' | 'medium' | 'strong';
  };
  mfa: {
    enabled: boolean;
    method: 'totp' | 'sms' | null;
    totpSecret?: string;
    qrCode?: string;
  };
  linkedAccounts: {
    google: boolean;
    whatsappBusiness: boolean;
  };
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
}

// Profile Settings
export interface ProfileSettings {
  personal: {
    name: string;
    photo: string | null;
    bio: string;
    location: string | null;
  };
  professional: {
    cohort: string;
    cohortRank: string; // "#3/127"
    track: string;
    trackProgress: number; // 68%
    readiness: number; // 82%
    certifications: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
      badgeUrl?: string;
    }>;
  };
  portfolio: {
    publicProfile: boolean;
    viewsThisWeek: number;
    employerShare: Array<{
      company: string;
      enabled: boolean;
      views: number;
    }>;
    mentorShare: {
      enabled: boolean;
      mentorId?: string;
      mentorName?: string;
    };
    resumeUrl: string | null;
    resumeExpiry: string | null;
  };
}

// Notification Settings
export interface NotificationSettings {
  channels: {
    email: {
      enabled: boolean;
      frequency: 'daily' | 'immediate';
      categories: {
        dailyDigest: boolean;
        quizDue: boolean;
        careerMatch: boolean;
      };
    };
    sms: {
      enabled: boolean;
      whatsappBusiness: boolean;
      categories: {
        urgentAlerts: boolean;
        mttrBreach: boolean;
        placement: boolean;
      };
    };
    push: {
      enabled: boolean;
      deviceTokens: string[];
      categories: {
        newMission: boolean;
        streakBroken: boolean;
      };
    };
    inApp: {
      enabled: boolean; // Always true, cannot disable
      style: 'banner' | 'toast' | 'email-fallback';
    };
  };
  priorities: {
    critical: Array<'mttr' | 'quiz-overdue'>;
    high: Array<'career-match' | 'portfolio-view'>;
    low: Array<'daily-streak' | 'video-recommended'>;
  };
}

// Privacy Settings
export interface PrivacySettings {
  profileVisibility: {
    publicPortfolio: boolean;
    viewsThisWeek: number;
    readinessScore: boolean;
    missionSubmissions: 'private' | 'mentors' | 'all';
  };
  dataSharing: {
    employers: Array<{
      company: string;
      enabled: boolean;
      scope: 'full' | 'readiness-only';
      views: number;
    }>;
    mentors: {
      enabled: boolean;
      currentMentors: Array<{
        id: string;
        name: string;
        access: 'full' | 'limited';
      }>;
      futureMentors: boolean;
    };
  };
  gdpr: {
    dataExport: {
      lastExport?: string;
      formats: Array<'json' | 'pdf'>;
    };
    analyticsOptOut: boolean;
    dataRetention: 'forever' | '2-years';
  };
  auditLog: Array<{
    id: string;
    action: string;
    timestamp: string;
    details: string;
  }>;
}

// Subscription Settings
export interface SubscriptionSettings {
  tier: {
    name: 'pro7' | 'pro7-max' | 'enterprise' | 'free';
    displayName: string;
    active: boolean;
    activeUntil: string;
    price: {
      amount: number;
      currency: string;
      period: 'monthly' | 'yearly';
    };
  };
  seats: {
    used: number;
    total: number;
    upgradeAvailable: boolean;
  };
  billing: {
    paymentMethod: {
      type: 'card' | 'mpesa';
      last4?: string;
      brand?: string;
    };
    nextBilling: {
      date: string;
      amount: number;
      currency: string;
    };
    history: Array<{
      id: string;
      date: string;
      amount: number;
      currency: string;
      status: 'paid' | 'pending' | 'failed';
      invoiceUrl?: string;
    }>;
  };
}

// Preferences Settings
export interface PreferencesSettings {
  dashboard: {
    layout: 'compact' | 'detailed';
    defaultTab: 'lab' | 'learning' | 'career' | 'metrics';
    theme: 'dark' | 'light';
  };
  workflow: {
    alertUrgency: 'high' | 'all';
    mttrTarget: number; // minutes (30, 20, custom)
    autoSave: {
      screenshots: boolean;
      notes: boolean;
    };
  };
  lab: {
    defaultTool: 'siem' | 'wireshark' | 'yara' | 'sigma';
    alertFilters: Array<'ryuk' | 'phishing' | 'all'>;
  };
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    keyboardShortcuts: boolean;
  };
  notifications: {
    sound: 'default' | 'none';
  };
}

// Combined Settings Response
export interface AnalystSettings {
  account: AccountSettings;
  profile: ProfileSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  subscription: SubscriptionSettings;
  preferences: PreferencesSettings;
}

