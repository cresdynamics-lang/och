/**
 * useRecipeEntitlements Hook
 *
 * Manages recipe access based on user subscription entitlements.
 */
'use client';

import { useAuth } from '@/hooks/useAuth';
import type { RecipeListResponse } from '@/services/types/recipes';

export type SubscriptionTier = 'free' | 'starter_enhanced' | 'starter_normal' | 'professional';

export interface RecipeEntitlementResult {
  canAccessRecipe: (recipe: RecipeListResponse) => boolean;
  getEntitlementMessage: (recipe: RecipeListResponse) => string;
  getLimitedAccessCount: () => number;
  isPremiumFeature: (feature: string) => boolean;
  subscriptionTier: SubscriptionTier | null;
}

// Mock entitlement logic - replace with actual subscription service
const getSubscriptionTier = (user: any): SubscriptionTier => {
  // This should come from your subscription service
  // For now, return based on user role or mock data
  if (user?.subscription_tier) {
    return user.subscription_tier as SubscriptionTier;
  }
  return 'free'; // Default to free tier
};

const ENTITLEMENT_RULES: Record<SubscriptionTier, {
  maxRecipes: number;
  allowedTracks: string[];
  allowedLevels: string[];
  premiumFeatures: string[];
}> = {
  free: {
    maxRecipes: 5,
    allowedTracks: ['defender'], // Only basic defender recipes
    allowedLevels: ['beginner'],
    premiumFeatures: []
  },
  starter_normal: {
    maxRecipes: 25,
    allowedTracks: ['defender', 'offensive'],
    allowedLevels: ['beginner', 'intermediate'],
    premiumFeatures: ['ai_coach', 'advanced_filters']
  },
  starter_enhanced: {
    maxRecipes: 50,
    allowedTracks: ['defender', 'offensive', 'grc'],
    allowedLevels: ['beginner', 'intermediate', 'advanced'],
    premiumFeatures: ['ai_coach', 'advanced_filters', 'llm_generation', 'priority_support']
  },
  professional: {
    maxRecipes: -1, // Unlimited
    allowedTracks: ['defender', 'offensive', 'grc', 'innovation', 'leadership'],
    allowedLevels: ['beginner', 'intermediate', 'advanced', 'mastery'],
    premiumFeatures: ['ai_coach', 'advanced_filters', 'llm_generation', 'priority_support', 'custom_recipes', 'analytics']
  }
};

export function useRecipeEntitlements(): RecipeEntitlementResult {
  const { user } = useAuth();
  const subscriptionTier = getSubscriptionTier(user);
  const rules = ENTITLEMENT_RULES[subscriptionTier];

  const canAccessRecipe = (recipe: RecipeListResponse): boolean => {
    // Always allow access to defender beginner recipes - they are completely open
    if (recipe.track_code === 'defender' && recipe.level === 'beginner') {
      return true;
    }

    // First check if user has full access to this recipe based on their enrolled track
    if (user?.track_key && recipe.track_code === user.track_key) {
      return true; // Full access to user's enrolled track
    }

    // Check track access based on subscription
    if (!rules.allowedTracks.includes(recipe.track_code)) {
      return false;
    }

    // Check level access based on subscription
    if (!rules.allowedLevels.includes(recipe.level)) {
      return false;
    }

    // For free tier, also check recipe count limit
    if (subscriptionTier === 'free') {
      // This would need to be tracked per user - for now, allow all free tier recipes
      return true;
    }

    return true;
  };

  const getEntitlementMessage = (recipe: RecipeListResponse): string => {
    if (canAccessRecipe(recipe)) {
      return '';
    }

    // If user has a track but this recipe is from a different track, show track-specific message
    if (user?.track_key && recipe.track_code !== user.track_key) {
      return `Switch to ${recipe.track_code} track or upgrade to access these recipes`;
    }

    if (!rules.allowedTracks.includes(recipe.track_code)) {
      return `Upgrade to ${subscriptionTier === 'free' ? 'Starter' : 'Professional'} to access ${recipe.track_code} recipes`;
    }

    if (!rules.allowedLevels.includes(recipe.level)) {
      return `Upgrade to ${subscriptionTier === 'free' ? 'Starter' : subscriptionTier === 'starter_normal' ? 'Enhanced' : 'Professional'} for ${recipe.level} recipes`;
    }

    return 'This recipe requires a higher subscription tier';
  };

  const getLimitedAccessCount = (): number => {
    return rules.maxRecipes;
  };

  const isPremiumFeature = (feature: string): boolean => {
    return rules.premiumFeatures.includes(feature);
  };

  return {
    canAccessRecipe,
    getEntitlementMessage,
    getLimitedAccessCount,
    isPremiumFeature,
    subscriptionTier
  };
}
