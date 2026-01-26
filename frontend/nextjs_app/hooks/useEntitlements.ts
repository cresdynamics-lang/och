/**
 * Entitlements Hook
 * Real-time feature flags based on subscription and settings
 */

import { useQuery } from '@tanstack/react-query';
import { useSettingsMaster } from './useSettingsMaster';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function useEntitlements(userId?: string) {
  const { entitlements: masterEntitlements, isLoading, error, refetch, settings } = useSettingsMaster(userId);

  const checkAccess = (feature: string) => {
    // Basic implementation since checkFeatureAccess is gone
    if (!masterEntitlements) return false;
    return !!masterEntitlements[feature];
  };

  return {
    entitlements: masterEntitlements,
    isLoading,
    error,
    refetch,
    checkAccess,
    featureGates: {}, // Simplified
    hasAICoachAccess: masterEntitlements?.aiCoachFullAccess || false,
    hasMentorAccess: masterEntitlements?.mentorAccess || false,
    canExportPortfolio: masterEntitlements?.portfolioExportEnabled || false,
  };
}

