/**
 * OCH Recipe Engine Entitlements Middleware
 * Handles subscription-based access control for recipes
 */

import { NextRequest, NextResponse } from 'next/server';
import { Recipe, RecipeQueryParams } from '@/lib/types/recipes';

export enum SubscriptionTier {
  FREE = 'free',
  STARTER_NORMAL = 'starter_normal',
  STARTER_ENHANCED = 'starter_enhanced',
  PROFESSIONAL = 'professional',
}

export interface UserEntitlements {
  tier: SubscriptionTier;
  recipe_limit_per_month: number;
  llm_generations_per_month: number;
  advanced_filters: boolean;
  export_access: boolean;
  priority_support: boolean;
}

// Entitlement configurations
export const ENTITLEMENTS_CONFIG: Record<SubscriptionTier, UserEntitlements> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    recipe_limit_per_month: 5,
    llm_generations_per_month: 0,
    advanced_filters: false,
    export_access: false,
    priority_support: false,
  },
  [SubscriptionTier.STARTER_NORMAL]: {
    tier: SubscriptionTier.STARTER_NORMAL,
    recipe_limit_per_month: 50,
    llm_generations_per_month: 5,
    advanced_filters: false,
    export_access: false,
    priority_support: false,
  },
  [SubscriptionTier.STARTER_ENHANCED]: {
    tier: SubscriptionTier.STARTER_ENHANCED,
    recipe_limit_per_month: 100,
    llm_generations_per_month: 15,
    advanced_filters: true,
    export_access: false,
    priority_support: false,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    tier: SubscriptionTier.PROFESSIONAL,
    recipe_limit_per_month: -1, // Unlimited
    llm_generations_per_month: -1, // Unlimited
    advanced_filters: true,
    export_access: true,
    priority_support: true,
  },
};

// Middleware class for recipe access control
export class RecipeEntitlementsMiddleware {
  /**
   * Check if user can access recipe listing with given filters
   */
  static checkRecipeListAccess(
    userTier: SubscriptionTier,
    queryParams: RecipeQueryParams
  ): { allowed: boolean; reason?: string } {
    const entitlements = ENTITLEMENTS_CONFIG[userTier];

    // Free users can only access basic filters
    if (userTier === SubscriptionTier.FREE) {
      const restrictedParams = ['difficulty', 'search'];
      const hasRestrictedParam = restrictedParams.some(param => queryParams[param as keyof RecipeQueryParams]);

      if (hasRestrictedParam) {
        return {
          allowed: false,
          reason: 'Advanced filters require a paid subscription',
        };
      }

      // Limit results for free users
      if (!queryParams.limit || queryParams.limit > 10) {
        queryParams.limit = 10;
      }
    }

    // Starter users get basic advanced filters but not all
    if (userTier === SubscriptionTier.STARTER_NORMAL && queryParams.search) {
      return {
        allowed: false,
        reason: 'Full-text search requires Enhanced or Professional plan',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can access a specific recipe
   */
  static checkRecipeAccess(
    userTier: SubscriptionTier,
    recipe: Recipe,
    userProgressCount: number
  ): { allowed: boolean; reason?: string } {
    const entitlements = ENTITLEMENTS_CONFIG[userTier];

    // Free users can only access beginner level recipes
    if (userTier === SubscriptionTier.FREE && recipe.level !== 'beginner') {
      return {
        allowed: false,
        reason: 'Advanced recipes require a paid subscription',
      };
    }

    // Check monthly usage limits
    if (entitlements.recipe_limit_per_month !== -1 &&
        userProgressCount >= entitlements.recipe_limit_per_month) {
      return {
        allowed: false,
        reason: `Monthly recipe limit (${entitlements.recipe_limit_per_month}) exceeded`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can generate new recipes via LLM
   */
  static checkRecipeGenerationAccess(
    userTier: SubscriptionTier,
    userGenerationCount: number
  ): { allowed: boolean; reason?: string } {
    const entitlements = ENTITLEMENTS_CONFIG[userTier];

    // Check if LLM generation is allowed for this tier
    if (entitlements.llm_generations_per_month === 0) {
      return {
        allowed: false,
        reason: 'Recipe generation requires a paid subscription',
      };
    }

    // Check monthly limits
    if (entitlements.llm_generations_per_month !== -1 &&
        userGenerationCount >= entitlements.llm_generations_per_month) {
      return {
        allowed: false,
        reason: `Monthly generation limit (${entitlements.llm_generations_per_month}) exceeded`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can access ingestion/source management features
   */
  static checkIngestionAccess(userTier: SubscriptionTier): { allowed: boolean; reason?: string } {
    // Only Professional tier can manage sources and ingestion
    if (userTier !== SubscriptionTier.PROFESSIONAL) {
      return {
        allowed: false,
        reason: 'Source management requires Professional subscription',
      };
    }

    return { allowed: true };
  }

  /**
   * Apply rate limiting for API calls
   */
  static async checkRateLimit(
    userId: string,
    endpoint: string,
    windowMinutes: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    // This would typically check Redis or a database for rate limiting
    // For now, return a mock response
    const maxRequests = 100; // requests per window
    const currentRequests = 0; // Would be fetched from Redis

    return {
      allowed: currentRequests < maxRequests,
      remaining: Math.max(0, maxRequests - currentRequests),
      resetTime: new Date(Date.now() + windowMinutes * 60 * 1000),
    };
  }
}

// API middleware function
export async function withRecipeEntitlements(
  request: NextRequest,
  handler: (request: NextRequest, entitlements: UserEntitlements) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract user entitlements from JWT token or session
    // This is a simplified implementation - in production you'd validate the JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Mock user entitlements extraction - in production this would decode JWT
    const mockUserTier = SubscriptionTier.PROFESSIONAL; // Default for development
    const entitlements = ENTITLEMENTS_CONFIG[mockUserTier];

    // Check rate limiting
    const rateLimit = await RecipeEntitlementsMiddleware.checkRateLimit(
      'mock-user-id', // Would be extracted from JWT
      request.url
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retry_after: Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toISOString(),
          },
        }
      );
    }

    return handler(request, entitlements);
  } catch (error) {
    console.error('Entitlements middleware error:', error);
    return NextResponse.json(
      { error: 'Entitlements check failed' },
      { status: 500 }
    );
  }
}

// Export utility functions
export const RecipeEntitlements = {
  checkRecipeListAccess: RecipeEntitlementsMiddleware.checkRecipeListAccess,
  checkRecipeAccess: RecipeEntitlementsMiddleware.checkRecipeAccess,
  checkRecipeGenerationAccess: RecipeEntitlementsMiddleware.checkRecipeGenerationAccess,
  checkIngestionAccess: RecipeEntitlementsMiddleware.checkIngestionAccess,
  checkRateLimit: RecipeEntitlementsMiddleware.checkRateLimit,
};
