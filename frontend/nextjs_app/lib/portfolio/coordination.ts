/**
 * Portfolio Coordination Module
 * Handles real-time sync between Portfolio, Settings, Missions, and Coaching
 */

import { createClient } from '@/lib/supabase/client';
import type { PortfolioItem, PortfolioVisibility } from './types';

const supabase = createClient();

/**
 * Sync portfolio items visibility when settings change
 */
export async function syncPortfolioVisibility(
  userId: string,
  newVisibility: PortfolioVisibility
): Promise<void> {
  try {
    // Update all approved portfolio items to match new visibility setting
    const { error } = await supabase
      .from('portfolio_items')
      .update({ visibility: newVisibility })
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (error) {
      console.error('Failed to sync portfolio visibility:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error syncing portfolio visibility:', error);
    throw error;
  }
}

/**
 * Check if mission should create portfolio item (85% threshold)
 */
export function shouldCreatePortfolioItem(missionScore: number): boolean {
  return missionScore >= 85;
}

/**
 * Create portfolio item from completed mission
 */
export async function createPortfolioFromMission(
  userId: string,
  missionId: string,
  missionData: {
    title: string;
    summary?: string;
    score: number;
    skills?: string[];
    files?: any[];
  }
): Promise<PortfolioItem | null> {
  // Only create if score meets threshold
  if (!shouldCreatePortfolioItem(missionData.score)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert({
        user_id: userId,
        title: `Mission: ${missionData.title}`,
        summary: missionData.summary || 'Auto-imported from completed mission',
        type: 'mission',
        mission_id: missionId,
        status: missionData.score >= 90 ? 'approved' : 'draft',
        visibility: 'private', // Will be synced with settings
        skill_tags: missionData.skills || [],
        evidence_files: missionData.files || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Sync visibility with current settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('portfolio_visibility')
      .eq('user_id', userId)
      .single();

    if (settings?.portfolio_visibility && data) {
      await supabase
        .from('portfolio_items')
        .update({ visibility: settings.portfolio_visibility })
        .eq('id', data.id);
    }

    return data as PortfolioItem;
  } catch (error) {
    console.error('Error creating portfolio from mission:', error);
    return null;
  }
}

/**
 * Get portfolio items for coaching recommendations
 */
export async function getPortfolioForCoaching(userId: string): Promise<{
  totalItems: number;
  approvedItems: number;
  recentItems: PortfolioItem[];
  topSkills: string[];
}> {
  const { data: items, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching portfolio for coaching:', error);
    return {
      totalItems: 0,
      approvedItems: 0,
      recentItems: [],
      topSkills: [],
    };
  }

  const approvedItems = items?.filter(item => item.status === 'approved') || [];
  const allSkills = items?.flatMap(item => item.skill_tags || []) || [];
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([skill]) => skill);

  return {
    totalItems: items?.length || 0,
    approvedItems: approvedItems.length,
    recentItems: (items || []).slice(0, 5) as PortfolioItem[],
    topSkills,
  };
}

/**
 * Update portfolio health when items change
 */
export async function updatePortfolioHealth(userId: string): Promise<void> {
  try {
    // Trigger marketplace profile update
    await supabase.rpc('update_marketplace_profile', {
      user_id: userId,
    });
  } catch (error) {
    console.error('Error updating portfolio health:', error);
  }
}

/**
 * Notify mentors and directors when a portfolio item is created
 * Calls Django API endpoint to handle notifications (mentors and directors)
 */
export async function notifyMentorsAndDirectors(
  userId: string,
  portfolioItemId: string,
  portfolioItemTitle: string
): Promise<void> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000';
    
    // Call Django API to handle notifications
    // This endpoint should:
    // 1. Get assigned mentors for the user
    // 2. Get directors
    // 3. Send notifications to all of them
    const response = await fetch(`${apiUrl}/api/v1/portfolio/notify-item-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        portfolio_item_id: portfolioItemId,
        portfolio_item_title: portfolioItemTitle,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to send notifications via API:', response.statusText);
    } else {
      console.log(`Notifications sent for portfolio item ${portfolioItemId}`);
    }
  } catch (error) {
    console.error('Error sending notifications to mentors and directors:', error);
    // Don't throw - notifications are non-critical
  }
}

