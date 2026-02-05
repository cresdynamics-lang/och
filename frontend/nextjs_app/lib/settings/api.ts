/**
 * Settings Engine - API Operations
 * Master control API for user settings
 */

import { createClient } from '@/lib/supabase/client';
import { calculateProfileCompleteness } from './profile-completeness';
import type { UserSettings, UserEntitlements, SettingsUpdate } from './types';

const supabase = createClient();

/**
 * Get user settings
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Settings don't exist, create default
      return createDefaultSettings(userId);
    }
    throw error;
  }

  return mapUserSettings(data);
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  updates: SettingsUpdate,
  hasPortfolioItems?: boolean
): Promise<UserSettings> {
  // Get current settings to calculate new completeness
  const currentSettings = await getUserSettings(userId);
  if (!currentSettings) throw new Error('Settings not found');

  // Merge updates with current settings
  const mergedSettings = { ...currentSettings, ...updates };
  
  // Check portfolio items if not provided
  let hasItems = hasPortfolioItems;
  if (hasItems === undefined) {
    const { data: portfolioItems } = await supabase
      .from('portfolio_items')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .limit(1);
    
    hasItems = (portfolioItems?.length || 0) > 0;
  }
  
  // Recalculate profile completeness
  const newCompleteness = calculateProfileCompleteness(mergedSettings, hasItems);
  
  // Include completeness in update
  const dbUpdates = {
    ...mapToDatabaseFormat(updates),
    profile_completeness: newCompleteness,
  };

  const { data, error } = await supabase
    .from('user_settings')
    .update(dbUpdates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapUserSettings(data);
}

/**
 * Get user entitlements
 */
export async function getUserEntitlements(userId: string): Promise<UserEntitlements | null> {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapUserEntitlements(data);
}

/**
 * Create default settings
 */
async function createDefaultSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      profile_completeness: 0,
      avatar_uploaded: false,
      linkedin_linked: false,
      bio_completed: false,
      name: null,
      headline: null,
      location: null,
      track: 'defender',
      timezone_set: 'Africa/Nairobi',
      language_preference: 'en',
      portfolio_visibility: 'private',
      marketplace_contact_enabled: false,
      data_sharing_consent: {},
      notifications_email: true,
      notifications_push: true,
      notifications_categories: {
        missions: true,
        coaching: true,
        mentor: false,
        marketplace: false,
      },
      ai_coach_style: 'motivational',
      habit_frequency: 'daily',
      reflection_prompt_style: 'guided',
      integrations: {},
    })
    .select()
    .single();

  if (error) throw error;
  return mapUserSettings(data);
}

/**
 * Map database format to TypeScript interface
 */
function mapUserSettings(data: any): UserSettings {
  return {
    userId: data.user_id,
    profileCompleteness: data.profile_completeness || 0,
    avatarUploaded: data.avatar_uploaded || false,
    linkedinLinked: data.linkedin_linked || false,
    bioCompleted: data.bio_completed || false,
    name: data.name,
    headline: data.headline,
    location: data.location,
    track: data.track || 'defender',
    timezoneSet: data.timezone_set || 'Africa/Nairobi',
    languagePreference: data.language_preference || 'en',
    portfolioVisibility: data.portfolio_visibility || 'private',
    marketplaceContactEnabled: data.marketplace_contact_enabled || false,
    dataSharingConsent: data.data_sharing_consent || {},
    notificationsEmail: data.notifications_email !== false,
    notificationsPush: data.notifications_push !== false,
    notificationsCategories: data.notifications_categories || {
      missions: true,
      coaching: true,
      mentor: true,
      marketplace: true,
    },
    aiCoachStyle: data.ai_coach_style || 'motivational',
    habitFrequency: data.habit_frequency || 'daily',
    reflectionPromptStyle: data.reflection_prompt_style || 'guided',
    integrations: data.integrations || {},
    twoFactorEnabled: data.two_factor_enabled || false,
    activeSessions: data.active_sessions || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapUserEntitlements(data: any): UserEntitlements {
  return {
    userId: data.user_id,
    profileCompleteness: data.profile_completeness || 0,
    tier: data.tier || 'free',
    subscriptionStatus: data.subscription_status || 'inactive',
    enhancedAccessUntil: data.enhanced_access_until,
    marketplaceFullAccess: data.marketplace_full_access || false,
    aiCoachFullAccess: data.ai_coach_full_access || false,
    mentorAccess: data.mentor_access || false,
    portfolioExportEnabled: data.portfolio_export_enabled || false,
  };
}

function mapToDatabaseFormat(updates: SettingsUpdate): any {
  const dbFormat: any = {};

  if (updates.profileCompleteness !== undefined) dbFormat.profile_completeness = updates.profileCompleteness;
  if (updates.avatarUploaded !== undefined) dbFormat.avatar_uploaded = updates.avatarUploaded;
  if (updates.linkedinLinked !== undefined) dbFormat.linkedin_linked = updates.linkedinLinked;
  if (updates.bioCompleted !== undefined) dbFormat.bio_completed = updates.bioCompleted;
  if (updates.name !== undefined) dbFormat.name = updates.name;
  if (updates.headline !== undefined) dbFormat.headline = updates.headline;
  if (updates.location !== undefined) dbFormat.location = updates.location;
  if (updates.track !== undefined) dbFormat.track = updates.track;
  if (updates.timezoneSet !== undefined) dbFormat.timezone_set = updates.timezoneSet;
  if (updates.languagePreference !== undefined) dbFormat.language_preference = updates.languagePreference;
  if (updates.portfolioVisibility !== undefined) dbFormat.portfolio_visibility = updates.portfolioVisibility;
  if (updates.marketplaceContactEnabled !== undefined) dbFormat.marketplace_contact_enabled = updates.marketplaceContactEnabled;
  if (updates.dataSharingConsent !== undefined) dbFormat.data_sharing_consent = updates.dataSharingConsent;
  if (updates.notificationsEmail !== undefined) dbFormat.notifications_email = updates.notificationsEmail;
  if (updates.notificationsPush !== undefined) dbFormat.notifications_push = updates.notificationsPush;
  if (updates.notificationsCategories !== undefined) dbFormat.notifications_categories = updates.notificationsCategories;
  if (updates.aiCoachStyle !== undefined) dbFormat.ai_coach_style = updates.aiCoachStyle;
  if (updates.habitFrequency !== undefined) dbFormat.habit_frequency = updates.habitFrequency;
  if (updates.reflectionPromptStyle !== undefined) dbFormat.reflection_prompt_style = updates.reflectionPromptStyle;
  if (updates.integrations !== undefined) dbFormat.integrations = updates.integrations;
  if (updates.twoFactorEnabled !== undefined) dbFormat.two_factor_enabled = updates.twoFactorEnabled;

  return dbFormat;
}

