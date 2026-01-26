/**
 * Hook for fetching and managing user progress
 */

'use client';

import { useState, useEffect } from 'react';
import { djangoClient } from '@/services/djangoClient';
import type { Progress } from '@/services/types';

export function useProgress(userId?: number) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      // Don't fetch if no user ID provided
      if (!userId) {
        setIsLoading(false);
        setProgress([]);
        return;
      }

      try {
        setIsLoading(true);
        // Backend expects user ID in params
        const params = { user: userId };
        const response = await djangoClient.progress.listProgress(params);
        setProgress(response.results || []);
        setError(null);
      } catch (err: any) {
        setError(err.data?.detail || err.detail || err.message || 'Failed to load progress');
        setProgress([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [userId]);

  const createProgress = async (data: {
    content_id: string;
    content_type: string;
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    completion_percentage?: number;
    metadata?: Record<string, any>;
  }) => {
    try {
      const newProgress = await djangoClient.progress.createProgress(data);
      setProgress([...progress, newProgress]);
      return newProgress;
    } catch (err: any) {
      setError(err.message || 'Failed to create progress');
      throw err;
    }
  };

  const updateProgress = async (id: number, data: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    completion_percentage?: number;
    score?: number;
    metadata?: Record<string, any>;
  }) => {
    try {
      const updated = await djangoClient.progress.updateProgress(id, data);
      setProgress(progress.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update progress');
      throw err;
    }
  };

  return {
    progress,
    isLoading,
    error,
    createProgress,
    updateProgress,
    refetch: () => {
      if (!userId) {
        return Promise.resolve();
      }
      setIsLoading(true);
      const params = { user: userId };
      return djangoClient.progress.listProgress(params)
        .then(response => {
          setProgress(response.results || []);
          setError(null);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.data?.detail || err.detail || err.message || 'Failed to load progress');
          setProgress([]);
          setIsLoading(false);
        });
    },
  };
}

