/**
 * Settings Engine - TypeScript Type Definitions
 * Master control types for platform coordination
 */

export interface UserSettings {
  userId: string;
  profileCompleteness: number;
  // Profile & Identity
  name?: string;
  headline?: string;
  location?: string;
  track?: 'defender' | 'attacker' | 'analyst' | 'architect' | 'manager';
  avatarUploaded: boolean;
  linkedinLinked: boolean;
  bioCompleted: boolean;
  timezoneSet: string;
  languagePreference: string;
  portfolioVisibility: 'private' | 'unlisted' | 'marketplace_preview' | 'public';
  marketplaceContactEnabled: boolean;
  dataSharingConsent: {
    talentscope?: boolean;
    marketplace?: boolean;
    analytics?: boolean;
  };
  notificationsEmail: boolean;
  notificationsPush: boolean;
  notificationsCategories: {
    missions?: boolean;
    coaching?: boolean;
    mentor?: boolean;
    marketplace?: boolean;
  };
  aiCoachStyle: 'motivational' | 'direct' | 'analytical';
  habitFrequency: 'daily' | 'weekly';
  reflectionPromptStyle: 'guided' | 'freeform' | 'structured';
  integrations: {
    github?: 'connected' | 'disconnected';
    thm?: 'connected' | 'disconnected';
    linkedin?: 'connected' | 'disconnected';
    futureYouPersona?: string;
    recommendedTrack?: string;
    bio?: string;
    linkedinUrl?: string;
  };
  // Security
  twoFactorEnabled?: boolean;
  activeSessions?: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UserEntitlements {
  userId: string;
  profileCompleteness: number;
  tier: 'free' | 'starter' | 'professional';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
  enhancedAccessUntil?: string;
  nextBillingDate?: string;
  marketplaceFullAccess: boolean;
  aiCoachFullAccess: boolean;
  mentorAccess: boolean;
  portfolioExportEnabled: boolean;
  missionAccess?: 'basic' | 'full';
  portfolioCapabilities?: string[];
}

export interface SystemStatus {
  title: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'upgrade' | 'error';
  impact: string;
  icon?: string;
}

export interface SettingsUpdate {
  profileCompleteness?: number;
  name?: string;
  headline?: string;
  location?: string;
  track?: 'defender' | 'attacker' | 'analyst' | 'architect' | 'manager';
  avatarUploaded?: boolean;
  linkedinLinked?: boolean;
  bioCompleted?: boolean;
  timezoneSet?: string;
  languagePreference?: string;
  portfolioVisibility?: 'private' | 'unlisted' | 'marketplace_preview' | 'public';
  marketplaceContactEnabled?: boolean;
  dataSharingConsent?: Partial<UserSettings['dataSharingConsent']>;
  notificationsEmail?: boolean;
  notificationsPush?: boolean;
  notificationsCategories?: Partial<UserSettings['notificationsCategories']>;
  aiCoachStyle?: 'motivational' | 'direct' | 'analytical';
  habitFrequency?: 'daily' | 'weekly';
  reflectionPromptStyle?: 'guided' | 'freeform' | 'structured';
  integrations?: Partial<UserSettings['integrations']>;
  twoFactorEnabled?: boolean;
}

