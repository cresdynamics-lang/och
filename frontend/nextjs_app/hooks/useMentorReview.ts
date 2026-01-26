/**
 * Mentor Review Hook
 * Handles review operations and scoring
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPortfolioReviews,
  createPortfolioReview,
  approveReview,
} from '@/lib/portfolio/api';
import { calculateWeightedScore, getRubricForType } from '@/lib/portfolio/rubrics';
import type { PortfolioItem } from '@/lib/portfolio/types';

// Local fallback type; upstream API does not export CreateReviewInput
type CreateReviewInput = any;

export function useMentorReview(itemId: string) {
  const queryClient = useQueryClient();

  const {
    data: reviews,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-reviews', itemId],
    queryFn: () => getPortfolioReviews(itemId),
    enabled: !!itemId,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      return createPortfolioReview(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-reviews', itemId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-items'] });
      refetch();
    },
  });

  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return approveReview(reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-reviews', itemId] });
      refetch();
    },
  });

  return {
    reviews: reviews || [],
    isLoading,
    error,
    createReview: createReviewMutation.mutate,
    approveReview: approveReviewMutation.mutate,
    isCreating: createReviewMutation.isPending,
    isApproving: approveReviewMutation.isPending,
  };
}

export function useRubric(item: PortfolioItem) {
  const rubric = getRubricForType(item.type);

  const calculateScore = (scores: Record<string, number>): number => {
    return calculateWeightedScore(rubric, scores);
  };

  return {
    rubric,
    calculateScore,
  };
}

