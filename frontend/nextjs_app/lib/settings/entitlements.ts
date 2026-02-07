/**
 * Settings Engine - Entitlements Logic
 * Feature gating based on subscription and settings
 */

import type { UserEntitlements, UserSettings } from './types';

export interface FeatureGate {
  feature: string;
  enabled: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

/**
 * Check if user has access to a feature
 */
export function checkFeatureAccess(
  entitlements: UserEntitlements | null,
  settings: UserSettings | null,
  feature: string
): FeatureGate {
  if (!entitlements || !settings) {
    return {
      feature,
      enabled: false,
      reason: 'User data not loaded',
      upgradeRequired: false,
    };
  }

  switch (feature) {
    case 'marketplace_full':
      return {
        feature,
        enabled: entitlements.marketplaceFullAccess,
        reason: entitlements.marketplaceFullAccess
          ? 'Full marketplace access enabled'
          : settings.profileCompleteness < 80
          ? `Profile ${settings.profileCompleteness}% complete (80% required)`
          : entitlements.tier !== 'professional'
          ? 'Professional tier required'
          : 'Marketplace access not enabled',
        upgradeRequired: entitlements.tier !== 'professional',
      };

    case 'ai_coach_full':
      return {
        feature,
        enabled: entitlements.aiCoachFullAccess,
        reason: entitlements.aiCoachFullAccess
          ? 'Full AI Coach access enabled'
          : 'Professional tier or enhanced access required',
        upgradeRequired: entitlements.tier !== 'professional',
      };

    case 'mentor_access':
      return {
        feature,
        enabled: entitlements.mentorAccess,
        reason: entitlements.mentorAccess
          ? 'Mentor access enabled'
          : 'Starter or Professional tier required',
        upgradeRequired: entitlements.tier === 'free',
      };

    case 'portfolio_export':
      return {
        feature,
        enabled: entitlements.portfolioExportEnabled,
        reason: entitlements.portfolioExportEnabled
          ? 'Portfolio export enabled'
          : 'Starter or Professional tier required',
        upgradeRequired: entitlements.tier === 'free',
      };

    case 'marketplace_contact':
      return {
        feature,
        enabled: settings.marketplaceContactEnabled && settings.profileCompleteness >= 80,
        reason: settings.marketplaceContactEnabled
          ? settings.profileCompleteness < 80
            ? `Profile ${settings.profileCompleteness}% complete (80% required)`
            : 'Contact enabled'
          : 'Contact feature disabled in settings',
        upgradeRequired: false,
      };

    default:
      return {
        feature,
        enabled: false,
        reason: 'Unknown feature',
        upgradeRequired: false,
      };
  }
}

/**
 * Get all feature gates for user
 */
export function getAllFeatureGates(
  entitlements: UserEntitlements | null,
  settings: UserSettings | null
): FeatureGate[] {
  const features = [
    'marketplace_full',
    'ai_coach_full',
    'mentor_access',
    'portfolio_export',
    'marketplace_contact',
  ];

  return features.map((feature) => checkFeatureAccess(entitlements, settings, feature));
}

/**
 * Get upgrade recommendations
 */
export function getUpgradeRecommendations(
  entitlements: UserEntitlements | null,
  settings: UserSettings | null
): string[] {
  const recommendations: string[] = [];

  if (!entitlements || !settings) return recommendations;

  if (settings.profileCompleteness < 80) {
    recommendations.push(`Complete your profile (${settings.profileCompleteness}% → 80%) to unlock marketplace`);
  }

  if (entitlements.tier === 'free') {
    recommendations.push('Upgrade to Starter or Professional for mentor access');
  }

  if (entitlements.tier !== 'professional' && settings.profileCompleteness >= 80) {
    recommendations.push('Upgrade to Professional for full marketplace and AI Coach access');
  }

  if (!settings.marketplaceContactEnabled && settings.profileCompleteness >= 80) {
    recommendations.push('Enable marketplace contact to receive opportunities');
  }

  return recommendations;
}

