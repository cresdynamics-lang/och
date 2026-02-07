/**
 * Portfolio Engine - Zustand State Management
 * Central store for portfolio items, reviews, and marketplace profiles
 */

import { create } from 'zustand';
import type {
  PortfolioItem,
  PortfolioReview,
  MarketplaceProfile,
  PortfolioHealthMetrics,
} from './types';

interface PortfolioState {
  // State
  items: PortfolioItem[];
  reviews: PortfolioReview[];
  marketplaceProfile: MarketplaceProfile | null;
  healthMetrics: PortfolioHealthMetrics | null;
  selectedItem: PortfolioItem | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Items
  setItems: (items: PortfolioItem[]) => void;
  addItem: (item: PortfolioItem) => void;
  updateItem: (id: string, updates: Partial<PortfolioItem>) => void;
  deleteItem: (id: string) => void;
  setSelectedItem: (item: PortfolioItem | null) => void;

  // Actions - Reviews
  setReviews: (reviews: PortfolioReview[]) => void;
  addReview: (review: PortfolioReview) => void;
  updateReview: (id: string, updates: Partial<PortfolioReview>) => void;

  // Actions - Marketplace
  setMarketplaceProfile: (profile: MarketplaceProfile | null) => void;
  updateMarketplaceProfile: (updates: Partial<MarketplaceProfile>) => void;

  // Actions - Health Metrics
  setHealthMetrics: (metrics: PortfolioHealthMetrics) => void;

  // Actions - UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Computed getters
  getItemsByStatus: (status: PortfolioItem['status']) => PortfolioItem[];
  getItemsByType: (type: PortfolioItem['type']) => PortfolioItem[];
  getPendingReviews: () => PortfolioItem[];
  getApprovedItems: () => PortfolioItem[];
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  // Initial state
  items: [],
  reviews: [],
  marketplaceProfile: null,
  healthMetrics: null,
  selectedItem: null,
  isLoading: false,
  error: null,

  // Items actions
  setItems: (items) => set({ items }),
  
  addItem: (item) => set((state) => ({
    items: [item, ...state.items],
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
    selectedItem: state.selectedItem?.id === id
      ? { ...state.selectedItem, ...updates }
      : state.selectedItem,
  })),
  
  deleteItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
  })),
  
  setSelectedItem: (item) => set({ selectedItem: item }),

  // Reviews actions
  setReviews: (reviews) => set({ reviews }),
  
  addReview: (review) => set((state) => ({
    reviews: [review, ...state.reviews],
  })),
  
  updateReview: (id, updates) => set((state) => ({
    reviews: state.reviews.map((review) =>
      review.id === id ? { ...review, ...updates } : review
    ),
  })),

  // Marketplace actions
  setMarketplaceProfile: (profile) => set({ marketplaceProfile: profile }),
  
  updateMarketplaceProfile: (updates) => set((state) => ({
    marketplaceProfile: state.marketplaceProfile
      ? { ...state.marketplaceProfile, ...updates }
      : null,
  })),

  // Health metrics actions
  setHealthMetrics: (metrics) => set({ healthMetrics: metrics }),

  // UI state actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Computed getters
  getItemsByStatus: (status) => {
    return get().items.filter((item) => item.status === status);
  },
  
  getItemsByType: (type) => {
    return get().items.filter((item) => item.type === type);
  },
  
  getPendingReviews: () => {
    return get().items.filter((item) => item.status === 'in_review');
  },
  
  getApprovedItems: () => {
    return get().items.filter((item) => item.status === 'approved');
  },
}));

