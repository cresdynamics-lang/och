/**
 * Portfolio Engine - Core Hook
 * Data fetching and mutations for portfolio items
 */

import { useEffect, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiGateway } from '@/services/apiGateway';

// Minimal type definitions
export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft' | 'in_review' | 'submitted';
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CreatePortfolioItemInput {
  title: string;
  description?: string;
  [key: string]: any;
}

export interface UpdatePortfolioItemInput {
  title?: string;
  description?: string;
  status?: string;
  [key: string]: any;
}

interface PortfolioHealthMetrics {
  totalItems: number;
  approvedItems: number;
  pendingReviews: number;
  averageScore: number;
  healthScore: number;
  topSkills: string[];
}

interface PortfolioResponse {
  items?: PortfolioItem[];
  [key: string]: any;
}

// Stub portfolio API functions - replace with actual Django backend calls
const getPortfolioItems = async (userId: string): Promise<PortfolioItem[]> => {
  try {
    const response = await apiGateway.get(`/student/dashboard/portfolio/${userId}`) as PortfolioResponse;
    return response.items || [];
  } catch (error) {
    console.error('Error fetching portfolio items:', error);
    return [];
  }
};

const getPortfolioItem = async (itemId: string): Promise<PortfolioItem | null> => {
  try {
    return await apiGateway.get(`/student/dashboard/portfolio/item/${itemId}`);
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    return null;
  }
};

const createPortfolioItem = async (userId: string, input: any): Promise<PortfolioItem> => {
  return await apiGateway.post(`/student/dashboard/portfolio/${userId}/items`, input);
};

const updatePortfolioItem = async (itemId: string, input: any): Promise<PortfolioItem> => {
  return await apiGateway.patch(`/student/dashboard/portfolio/item/${itemId}`, input);
};

const deletePortfolioItem = async (itemId: string): Promise<void> => {
  await apiGateway.delete(`/student/dashboard/portfolio/item/${itemId}`);
};

const getPortfolioHealthMetrics = async (userId: string): Promise<any> => {
  try {
    const response = await apiGateway.get(`/student/dashboard/portfolio/${userId}/health`);
    return response || {
      totalItems: 0,
      approvedItems: 0,
      pendingReviews: 0,
      averageScore: 0,
      healthScore: 0,
      topSkills: [],
    };
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    return {
      totalItems: 0,
      approvedItems: 0,
      pendingReviews: 0,
      averageScore: 0,
      healthScore: 0,
      topSkills: [],
    };
  }
};

export function usePortfolio(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<PortfolioHealthMetrics>({
    totalItems: 0,
    approvedItems: 0,
    pendingReviews: 0,
    averageScore: 0,
    healthScore: 0,
    topSkills: [],
  });

  // Get current user if not provided
  const getCurrentUserId = useCallback(async () => {
    if (userId) return userId;
    return user?.id?.toString();
  }, [userId, user]);

  // Fetch portfolio items
  const {
    data: portfolioItems,
    isLoading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['portfolio-items', userId],
    queryFn: async () => {
      const id = userId || await getCurrentUserId();
      if (!id) {
        console.warn('No user ID available for portfolio fetch');
        return [];
      }
      try {
        const items = await getPortfolioItems(id);
        return items || [];
      } catch (error) {
        console.error('Error fetching portfolio items:', error);
        return [];
      }
    },
    enabled: true, // Always enabled, will handle empty userId in queryFn
    staleTime: 30000, // 30 seconds
  });

  // Fetch health metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['portfolio-health', userId],
    queryFn: async () => {
      const id = userId || await getCurrentUserId();
      if (!id) {
        console.warn('No user ID available for health metrics');
        return {
          totalItems: 0,
          approvedItems: 0,
          pendingReviews: 0,
          averageScore: 0,
          healthScore: 0,
          topSkills: [],
        };
      }
      try {
        return await getPortfolioHealthMetrics(id);
      } catch (error) {
        console.error('Error fetching health metrics:', error);
        return {
          totalItems: 0,
          approvedItems: 0,
          pendingReviews: 0,
          averageScore: 0,
          healthScore: 0,
          topSkills: [],
        };
      }
    },
    enabled: true, // Always enabled, will handle empty userId in queryFn
    staleTime: 60000, // 1 minute
  });

  // Create portfolio item mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreatePortfolioItemInput) => {
      const id = await getCurrentUserId();
      if (!id) throw new Error('User not authenticated');
      return createPortfolioItem(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', userId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-health', userId] });
      refetchItems();
      refetchMetrics();
    },
    onError: (error: Error) => {
      console.error('Error creating portfolio item:', error);
    },
  });

  // Update portfolio item mutation
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, input }: { itemId: string; input: UpdatePortfolioItemInput }) => {
      return updatePortfolioItem(itemId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', userId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-health', userId] });
      refetchItems();
      refetchMetrics();
    },
    onError: (error: Error) => {
      console.error('Error updating portfolio item:', error);
    },
  });

  // Delete portfolio item mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return deletePortfolioItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items', userId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-health', userId] });
      refetchItems();
      refetchMetrics();
    },
    onError: (error: Error) => {
      console.error('Error deleting portfolio item:', error);
    },
  });

  // Sync state with query data
  useEffect(() => {
    if (portfolioItems) {
      setItems(portfolioItems);
    }
  }, [portfolioItems]);

  useEffect(() => {
    if (metrics) {
      setHealthMetrics(metrics);
    }
  }, [metrics]);

  // Note: Realtime subscriptions removed - using polling instead
  // You can add polling here if needed, or implement WebSocket/Django Channels later
  useEffect(() => {
    // Optional: Set up polling for portfolio updates
    // const interval = setInterval(() => {
    //   refetchItems();
    //   refetchMetrics();
    // }, 30000); // Poll every 30 seconds
    // return () => clearInterval(interval);
  }, [userId, refetchItems, refetchMetrics]);

  // Use query data if available, otherwise fall back to store
  const currentItems = (portfolioItems && portfolioItems.length > 0) ? portfolioItems : (items && items.length > 0 ? items : []);
  const currentMetrics = metrics || healthMetrics || {
    totalItems: 0,
    approvedItems: 0,
    pendingReviews: 0,
    averageScore: 0,
    healthScore: 0,
    topSkills: [],
  };

  return {
    // Data
    items: currentItems,
    healthMetrics: currentMetrics,
    topSkills: currentMetrics.topSkills || [],
    pendingReviews: currentItems.filter((item) => item.status === 'in_review' || item.status === 'submitted'),
    approvedItems: currentItems.filter((item) => item.status === 'approved'),

    // Loading states
    isLoading: itemsLoading || metricsLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error
    error: itemsError ? (itemsError instanceof Error ? itemsError.message : 'Failed to load portfolio') : null,

    // Actions
    createItem: createMutation.mutate,
    updateItem: (itemId: string, input: UpdatePortfolioItemInput) =>
      updateMutation.mutate({ itemId, input }),
    deleteItem: deleteMutation.mutate,
    refetch: () => {
      refetchItems();
      refetchMetrics();
    },
  };
}

export function usePortfolioItem(itemId: string) {
  const queryClient = useQueryClient();

  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-item', itemId],
    queryFn: () => getPortfolioItem(itemId),
    enabled: !!itemId,
  });

  // Note: Realtime subscriptions removed - using polling instead
  // You can add polling here if needed, or implement WebSocket/Django Channels later
  useEffect(() => {
    // Optional: Set up polling for single item updates
    // const interval = setInterval(() => {
    //   refetch();
    // }, 30000); // Poll every 30 seconds
    // return () => clearInterval(interval);
  }, [itemId, refetch]);

  return {
    item,
    isLoading,
    error,
    refetch,
  };
}
