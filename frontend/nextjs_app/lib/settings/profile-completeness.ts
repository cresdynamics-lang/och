/**
 * Settings Engine - Profile Completeness Calculator
 * Auto-calculates profile completeness percentage
 */

import type { UserSettings } from './types';

export interface CompletenessCheck {
  field: string;
  completed: boolean;
  weight: number;
  label: string;
}

/**
 * Calculate profile completeness
 */
export function calculateProfileCompleteness(
  settings: Partial<UserSettings>,
  hasPortfolioItems = false
): number {
  const checks: CompletenessCheck[] = [
    {
      field: 'avatarUploaded',
      completed: settings.avatarUploaded || false,
      weight: 15,
      label: 'Profile Photo',
    },
    {
      field: 'name',
      completed: !!(settings.name && settings.name.trim() !== ''),
      weight: 10,
      label: 'Full Name',
    },
    {
      field: 'headline',
      completed: !!(settings.headline && settings.headline.trim() !== ''),
      weight: 15,
      label: 'Professional Headline',
    },
    {
      field: 'location',
      completed: !!(settings.location && settings.location.trim() !== ''),
      weight: 5,
      label: 'Location',
    },
    {
      field: 'track',
      completed: !!settings.track,
      weight: 10,
      label: 'Career Track',
    },
    {
      field: 'linkedinLinked',
      completed: settings.linkedinLinked || false,
      weight: 15,
      label: 'LinkedIn Connection',
    },
    {
      field: 'bioCompleted',
      completed: settings.bioCompleted || false,
      weight: 20,
      label: 'Bio/Summary',
    },
    {
      field: 'timezoneSet',
      completed: !!(settings.timezoneSet && settings.timezoneSet !== ''),
      weight: 5,
      label: 'Timezone',
    },
    {
      field: 'portfolioVisibility',
      completed: settings.portfolioVisibility === 'marketplace_preview' || settings.portfolioVisibility === 'public',
      weight: 5,
      label: 'Portfolio Visibility',
    },
    {
      field: 'hasPortfolioItems',
      completed: hasPortfolioItems,
      weight: 10,
      label: 'Portfolio Items',
    },
  ];

  let total = 0;
  checks.forEach((check) => {
    if (check.completed) {
      total += check.weight;
    }
  });

  return Math.min(100, total);
}

/**
 * Get completeness breakdown
 */
export function getCompletenessBreakdown(settings: Partial<UserSettings>, hasPortfolioItems = false): CompletenessCheck[] {
  return [
    {
      field: 'avatarUploaded',
      completed: settings.avatarUploaded || false,
      weight: 15,
      label: 'Profile Photo',
    },
    {
      field: 'name',
      completed: !!(settings.name && settings.name.trim() !== ''),
      weight: 10,
      label: 'Full Name',
    },
    {
      field: 'headline',
      completed: !!(settings.headline && settings.headline.trim() !== ''),
      weight: 15,
      label: 'Professional Headline',
    },
    {
      field: 'location',
      completed: !!(settings.location && settings.location.trim() !== ''),
      weight: 5,
      label: 'Location',
    },
    {
      field: 'track',
      completed: !!settings.track,
      weight: 10,
      label: 'Career Track',
    },
    {
      field: 'linkedinLinked',
      completed: settings.linkedinLinked || false,
      weight: 15,
      label: 'LinkedIn Connection',
    },
    {
      field: 'bioCompleted',
      completed: settings.bioCompleted || false,
      weight: 20,
      label: 'Bio/Summary',
    },
    {
      field: 'timezoneSet',
      completed: !!(settings.timezoneSet && settings.timezoneSet !== ''),
      weight: 5,
      label: 'Timezone',
    },
    {
      field: 'portfolioVisibility',
      completed: settings.portfolioVisibility === 'marketplace_preview' || settings.portfolioVisibility === 'public',
      weight: 5,
      label: 'Portfolio Visibility',
    },
    {
      field: 'hasPortfolioItems',
      completed: hasPortfolioItems,
      weight: 10,
      label: 'Portfolio Items',
    },
  ];
}

/**
 * Get next steps to improve completeness
 */
export function getNextSteps(settings: Partial<UserSettings>, hasPortfolioItems = false): string[] {
  const steps: string[] = [];

  if (!settings.avatarUploaded) {
    steps.push('Upload a profile photo (+15%)');
  }

  if (!settings.name || settings.name.trim() === '') {
    steps.push('Add your full name (+10%)');
  }

  if (!settings.headline || settings.headline.trim() === '') {
    steps.push('Add a professional headline (+15%)');
  }

  if (!settings.location || settings.location.trim() === '') {
    steps.push('Add your location (+5%)');
  }

  if (!settings.track) {
    steps.push('Select your career track (+10%)');
  }

  if (!settings.linkedinLinked) {
    steps.push('Connect your LinkedIn account (+15%)');
  }

  if (!settings.bioCompleted) {
    steps.push('Complete your bio/summary (+20%)');
  }

  if (!settings.timezoneSet || settings.timezoneSet === '') {
    steps.push('Set your timezone (+5%)');
  }

  if (settings.portfolioVisibility !== 'marketplace_preview' && settings.portfolioVisibility !== 'public') {
    steps.push('Enable marketplace visibility (+5%)');
  }

  if (!hasPortfolioItems) {
    steps.push('Add approved portfolio items (+10%)');
  }

  return steps;
}

