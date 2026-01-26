/**
 * Coaching OS Hook
 * Provides easy access to AI coaching functionality
 */
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface CoachingAdvice {
  greeting: string;
  diagnosis: string;
  priorities: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    recipes?: string[];
    deadline?: string;
  }>;
  encouragement: string;
  actions?: any[];
}

interface UseCoachingOSReturn {
  advice: CoachingAdvice | null;
  loading: boolean;
  error: string | null;
  fetchCoaching: (trigger?: string, context?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCoachingOS(): UseCoachingOSReturn {
  const { user } = useAuth();
  const [advice, setAdvice] = useState<CoachingAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaching = useCallback(async (trigger = 'daily', context = 'dashboard') => {
    const userId = user?.id?.toString();
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coaching/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          context,
          trigger
        })
      });

      if (!response.ok) {
        throw new Error(`Coaching failed: ${response.status}`);
      }

      const { advice: coachingAdvice } = await response.json();
      setAdvice(coachingAdvice);
    } catch (err: any) {
      console.error('Failed to fetch coaching:', err);
      setError(err.message || 'Failed to load coaching advice');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(() => {
    return fetchCoaching('daily', 'dashboard');
  }, [fetchCoaching]);

  return {
    advice,
    loading,
    error,
    fetchCoaching,
    refresh
  };
}




