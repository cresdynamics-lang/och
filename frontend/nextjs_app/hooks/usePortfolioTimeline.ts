/**
 * Portfolio Timeline Hook
 * Fetches timeline events for portfolio activity
 * Uses portfolio items from Django backend
 */

import { useMemo } from 'react';
import type { PortfolioItem } from './usePortfolio';

// Timeline event type definition
export interface TimelineEvent {
  id: string;
  type: 'item_created' | 'item_approved' | 'review_received';
  title: string;
  description: string;
  portfolioItemId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface UsePortfolioTimelineProps {
  items?: PortfolioItem[];
  isLoading?: boolean;
}

export function usePortfolioTimeline({ items = [], isLoading = false }: UsePortfolioTimelineProps) {
  // Transform portfolio items into timeline events
  const timelineData = useMemo(() => {
    if (!items || items.length === 0) return [];

      const events: TimelineEvent[] = [];

    items.forEach((item) => {
        // Item created event
      if (item.created_at) {
        events.push({
          id: `${item.id}-created`,
          type: 'item_created',
          title: 'Portfolio item created',
          description: item.title || 'Untitled item',
          portfolioItemId: item.id,
          createdAt: item.created_at,
        });
      }

        // Item approved event
      if (item.status === 'approved' && item.updated_at) {
          events.push({
            id: `${item.id}-approved`,
            type: 'item_approved',
            title: 'Item approved',
          description: item.title || 'Untitled item',
            portfolioItemId: item.id,
          createdAt: item.updated_at,
          });
        }
      });

      // Sort by date (most recent first)
      return events.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [items]);

  return {
    timelineData,
    isLoading,
    error: null,
    refetch: () => {}, // No-op for now, data comes from usePortfolio
  };
}

