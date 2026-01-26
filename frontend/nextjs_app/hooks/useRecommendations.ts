/**
 * Recommendations hook
 * Fetches AI-powered recommendations from FastAPI
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { fastapiClient } from '../services/fastapiClient';
import type { RecommendationRequest, RecommendationResponse } from '../services/types';

interface UseRecommendationsOptions {
  userId: number;
  contentType?: string;
  limit?: number;
  autoFetch?: boolean;
}

export function useRecommendations(options: UseRecommendationsOptions) {
  const { userId, contentType, limit = 10, autoFetch = true } = options;
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fastapiClient.recommendations.getRecommendations({
        user_id: userId,
        content_type: contentType,
        limit,
      });
      setRecommendations(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, contentType, limit]);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchRecommendations();
    }
  }, [autoFetch, userId, fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refetch: fetchRecommendations,
  };
}

