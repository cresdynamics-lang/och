/**
 * Settings Engine - System Triggers
 * Cross-system event coordination
 */

import { createClient } from '@/lib/supabase/client';
import type { SettingsUpdate } from './types';

const supabase = createClient();

/**
 * Trigger cross-system updates when settings change
 */
export async function triggerSystemUpdates(
  userId: string,
  updates: SettingsUpdate
): Promise<void> {
  // Determine update type
  const updateType = determineUpdateType(updates);

  // Call edge function for coordination
  try {
    await fetch('/api/settings/coordinate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: updateType,
        changes: updates,
      }),
    });
  } catch (error) {
    console.error('Failed to trigger system updates:', error);
    // Continue anyway - triggers will handle it
  }

  // Local optimizations
  if (updates.profileCompleteness !== undefined || updates.avatarUploaded !== undefined) {
    // Trigger profile completeness recalculation
    await supabase.rpc('calculate_profile_completeness', { user_id: userId });
  }

  if (updates.portfolioVisibility !== undefined) {
    // Portfolio visibility sync is handled by database trigger
    // But we can also broadcast the change
    await supabase.channel(`portfolio_visibility_${userId}`).send({
      type: 'broadcast',
      event: 'visibility_changed',
      payload: { visibility: updates.portfolioVisibility },
    });
  }
}

function determineUpdateType(updates: SettingsUpdate): string {
  if (updates.profileCompleteness !== undefined || updates.avatarUploaded !== undefined) {
    return 'profile_completeness';
  }
  if (updates.portfolioVisibility !== undefined || updates.marketplaceContactEnabled !== undefined) {
    return 'privacy';
  }
  if (updates.notificationsEmail !== undefined || updates.notificationsCategories !== undefined) {
    return 'notification_preferences';
  }
  if (updates.aiCoachStyle !== undefined || updates.habitFrequency !== undefined) {
    return 'coaching_preferences';
  }
  return 'general';
}

/**
 * Broadcast settings change to all connected clients
 */
export async function broadcastSettingsChange(
  userId: string,
  type: string,
  changes: Partial<SettingsUpdate>
): Promise<void> {
  await supabase.channel(`settings_${userId}`).send({
    type: 'broadcast',
    event: 'settings_changed',
    payload: {
      userId,
      type,
      changes,
      timestamp: new Date().toISOString(),
    },
  });
}

