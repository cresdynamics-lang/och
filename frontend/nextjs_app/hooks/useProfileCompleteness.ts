/**
 * Profile Completeness Hook
 * Gamified progress tracking
 */

import { useMemo } from 'react';
import { useSettingsMaster } from './useSettingsMaster';
import { usePortfolio } from './usePortfolio';
import {
  calculateProfileCompleteness,
  getCompletenessBreakdown,
  getNextSteps,
} from '@/lib/settings/profile-completeness';

export function useProfileCompleteness(userId?: string) {
  const { settings } = useSettingsMaster(userId);
  const { items } = usePortfolio(userId);
  
  const hasPortfolioItems = items.length > 0;

  const completeness = useMemo(() => {
    if (!settings) return 0;
    return calculateProfileCompleteness(settings);
  }, [settings]);

  const breakdown = useMemo(() => {
    if (!settings) return [];
    return getCompletenessBreakdown(settings, hasPortfolioItems);
  }, [settings, hasPortfolioItems]);

  const nextSteps = useMemo(() => {
    if (!settings) return [];
    return getNextSteps(settings, hasPortfolioItems);
  }, [settings, hasPortfolioItems]);

  const isTalentReady = completeness >= 80;
  const progressToTalent = Math.max(0, 80 - completeness);

  return {
    completeness,
    breakdown,
    nextSteps,
    isTalentReady,
    progressToTalent,
    completedCount: breakdown.filter((item) => item.completed).length,
    totalCount: breakdown.length,
  };
}

