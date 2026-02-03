/**
 * Recipe Entitlements Hook
 * Check recipe access based on user subscription and entitlements
 */

import { useAuth } from './useAuth';
import type { RecipeListResponse } from '@/services/types/recipes';

export function useRecipeEntitlements() {
  const { user, isAuthenticated } = useAuth();

  const canAccessRecipe = (recipe: RecipeListResponse | any): boolean => {
    // If not authenticated, allow preview access only
    if (!isAuthenticated) {
      return false;
    }

    // If no entitlement tier required, anyone can access
    if (!recipe.entitlement_tier || recipe.entitlement_tier === 'all') {
      return true;
    }

    // For now, allow all authenticated users to access all recipes
    // TODO: Implement proper subscription tier checking
    return true;
  };

  const getEntitlementMessage = (recipe: RecipeListResponse | any): string => {
    if (!isAuthenticated) {
      return 'Sign in to access this recipe';
    }

    if (!recipe.entitlement_tier || recipe.entitlement_tier === 'all') {
      return '';
    }

    if (canAccessRecipe(recipe)) {
      return '';
    }

    switch (recipe.entitlement_tier) {
      case 'starter_enhanced':
        return 'Available with Starter Enhanced or Professional subscription';
      case 'professional':
        return 'Professional subscription required';
      default:
        return 'Upgrade to access this recipe';
    }
  };

  return {
    canAccessRecipe,
    getEntitlementMessage,
    isLoading: false,
    entitlements: null,
  };
}
