/**
 * Settings Master Hook
 * Orchestrates ALL platform coordination
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Type definitions
export interface UserSettings {
  portfolioVisibility?: 'private' | 'public';
  profileCompleteness?: number;
  [key: string]: any;
}

export interface UserEntitlements {
  tier?: 'starter' | 'professional';
  mentorAccess?: boolean;
  enhancedAccessUntil?: string;
  [key: string]: any;
}

export interface SettingsUpdate {
  portfolioVisibility?: 'private' | 'public';
  [key: string]: any;
}

// Fetch and update user settings from Django API
const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const { apiGateway } = await import('@/services/apiGateway');
    const response = await apiGateway.get('/settings') as any;
    // Map backend response to frontend format
    return {
      portfolioVisibility: response.portfolioVisibility || 'private',
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Return default settings on error
    return {
      portfolioVisibility: 'private',
    };
  }
};

const updateUserSettings = async (
  userId: string,
  updates: SettingsUpdate,
  hasPortfolioItems?: boolean
): Promise<UserSettings> => {
  try {
    const { apiGateway } = await import('@/services/apiGateway');
    // Map frontend format to backend format
    const payload: any = {};
    if (updates.portfolioVisibility) {
      payload.portfolioVisibility = updates.portfolioVisibility;
    }
    
    const response = await apiGateway.patch('/settings', payload) as any;
    // Map backend response to frontend format
    return {
      portfolioVisibility: response.portfolioVisibility || 'private',
    };
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

const getUserEntitlements = async (userId: string): Promise<UserEntitlements | null> => {
  try {
    const { apiGateway } = await import('@/services/apiGateway');
    // Fetch subscription status from the API
    const response = await apiGateway.get('/subscription/status') as any;
    
    // Map backend tier values to frontend tier values
    const tierMapping: Record<string, 'free' | 'starter' | 'professional'> = {
      'free': 'free',
      'starter_3': 'starter',
      'starter': 'starter',
      'professional_7': 'professional',
      'professional': 'professional',
      'premium': 'professional',
    };
    
    const mappedTier = tierMapping[response.tier || 'free'] || 'free';
    
    return {
      tier: mappedTier as any,
      subscriptionStatus: response.status === 'active' ? 'active' : 'inactive',
      mentorAccess: mappedTier !== 'free',
      portfolioExportEnabled: mappedTier !== 'free',
      missionAccess: mappedTier === 'professional' ? 'full' : 'basic',
      enhancedAccessUntil: response.days_enhanced_left ? 
        new Date(Date.now() + response.days_enhanced_left * 24 * 60 * 60 * 1000).toISOString() : 
        undefined,
      nextBillingDate: response.next_payment || response.next_billing_date,
      portfolioCapabilities: response.features || [],
    };
  } catch (error) {
    console.error('Error fetching user entitlements:', error);
    // Return default free tier on error
    return {
      tier: 'free' as any,
      subscriptionStatus: 'inactive',
      mentorAccess: false,
      portfolioExportEnabled: false,
      missionAccess: 'basic',
    };
  }
};

const triggerSystemUpdates = async (userId: string, updates: SettingsUpdate): Promise<void> => {
  // TODO: Implement system update triggers
  console.log('System updates triggered for user:', userId, updates);
};

const calculateProfileCompleteness = (
  settings: UserSettings,
  hasPortfolioItems: boolean
): number => {
  // Simple completeness calculation
  let completeness = 0;
  if (settings.portfolioVisibility) completeness += 50;
  if (hasPortfolioItems) completeness += 50;
  return Math.min(100, completeness);
};

export function useSettingsMaster(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);

  // Use provided userId or get from auth
  const currentUserId = userId || user?.id;

  // Fetch settings
  const {
    data: settingsData,
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['user-settings', currentUserId],
    queryFn: async () => {
      if (!currentUserId) {
        // Return null instead of throwing - let the component handle unauthenticated state
        return null;
      }
      return getUserSettings(currentUserId.toString());
    },
    enabled: !!currentUserId,
    staleTime: 30000,
    retry: false,
  });

  // Fetch entitlements
  const {
    data: entitlementsData,
    isLoading: entitlementsLoading,
    error: entitlementsError,
    refetch: refetchEntitlements,
  } = useQuery({
    queryKey: ['user-entitlements', currentUserId],
    queryFn: async () => {
      if (!currentUserId) {
        // Return null instead of throwing - let the component handle unauthenticated state
        return null;
      }
      return getUserEntitlements(currentUserId.toString());
    },
    enabled: !!currentUserId,
    staleTime: 30000,
    retry: false,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: SettingsUpdate & { hasPortfolioItems?: boolean }) => {
      if (!currentUserId) throw new Error('User not authenticated');
      
      const { hasPortfolioItems, ...updateData } = updates;
      
      // Update settings
      const result = await updateUserSettings(currentUserId.toString(), updateData, hasPortfolioItems);
      
      // Trigger cross-system updates
      await triggerSystemUpdates(currentUserId.toString(), updateData);
      
      return result;
    },
    onMutate: async (updates) => {
      // Optimistic update with completeness recalculation
      if (settings) {
        const { hasPortfolioItems = false, ...updateData } = updates;
        const mergedSettings = { ...settings, ...updateData } as UserSettings;
        const newCompleteness = calculateProfileCompleteness(mergedSettings, hasPortfolioItems);
        setSettings({ 
          ...mergedSettings, 
          profileCompleteness: newCompleteness 
        } as UserSettings);
      }
    },
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['user-settings', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-entitlements', currentUserId] });
      refetchSettings();
      refetchEntitlements();
    },
    onError: (error) => {
      // Revert optimistic update
      refetchSettings();
      throw error;
    },
  });

  // Sync store with query data
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  useEffect(() => {
    if (entitlementsData) {
      setEntitlements(entitlementsData);
    }
  }, [entitlementsData]);

  // Note: Realtime subscriptions removed - using polling/refetch instead
  // TODO: Implement Django WebSocket or polling for real-time updates if needed

  return {
    // Data
    settings,
    entitlements,
    
    // Loading states
    isLoading: settingsLoading || entitlementsLoading,
    isUpdating: updateMutation.isPending,
    
    // Errors
    error: settingsError || entitlementsError,
    
    // Actions
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    refetch: () => {
      refetchSettings();
      refetchEntitlements();
    },
  };
}

