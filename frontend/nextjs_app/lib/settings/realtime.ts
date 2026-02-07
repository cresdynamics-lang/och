/**
 * Settings Engine - Realtime Coordination
 * Supabase realtime channels for cross-system updates
 */

import { createClient } from '@/lib/supabase/client';
import type { UserSettings, UserEntitlements } from './types';

const supabase = createClient();

export interface SettingsChangeEvent {
  userId: string;
  type: 'profile' | 'privacy' | 'notifications' | 'subscription' | 'coaching';
  changes: Partial<UserSettings>;
}

export type SettingsChangeHandler = (event: SettingsChangeEvent) => void;

/**
 * Master realtime subscription for settings
 */
export function subscribeToSettingsChanges(
  userId: string,
  handlers: {
    onSettingsChange?: SettingsChangeHandler;
    onEntitlementsChange?: (entitlements: UserEntitlements) => void;
  }
) {
  const channel = supabase
    .channel(`settings_master_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_settings',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (handlers.onSettingsChange) {
          handlers.onSettingsChange({
            userId,
            type: determineChangeType(payload.new),
            changes: payload.new,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        if (handlers.onEntitlementsChange) {
          // Fetch updated entitlements
          const { data } = await supabase
            .from('user_entitlements')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (data) {
            handlers.onEntitlementsChange(mapEntitlements(data));
          }
        }
      }
    )
    .on(
      'broadcast',
      {
        event: 'settings_changed',
      },
      (payload) => {
        if (handlers.onSettingsChange) {
          const event = JSON.parse(payload.payload as string);
          handlers.onSettingsChange({
            userId: event.user_id,
            type: event.type,
            changes: event,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

function determineChangeType(newData: any): SettingsChangeEvent['type'] {
  if (newData.profile_completeness !== undefined || newData.avatar_uploaded !== undefined) {
    return 'profile';
  }
  if (newData.portfolio_visibility !== undefined || newData.marketplace_contact_enabled !== undefined) {
    return 'privacy';
  }
  if (newData.notifications_email !== undefined || newData.notifications_categories !== undefined) {
    return 'notifications';
  }
  if (newData.ai_coach_style !== undefined || newData.habit_frequency !== undefined) {
    return 'coaching';
  }
  return 'profile';
}

function mapEntitlements(data: any): UserEntitlements {
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

