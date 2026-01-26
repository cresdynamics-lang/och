/**
 * User data hook
 * Fetches and manages user data
 */

'use client';

import { useState, useEffect } from 'react';
import { djangoClient } from '../services/djangoClient';
import type { User } from '../services/types';

interface UseUserOptions {
  userId?: number;
  autoFetch?: boolean;
}

export function useUser(options: UseUserOptions = {}) {
  const { userId, autoFetch = false } = options;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async (id?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const targetId = id || userId;
      if (!targetId) {
        // Get current user
        const currentUser = await djangoClient.auth.getCurrentUser();
        setUser(currentUser);
      } else {
        const fetchedUser = await djangoClient.users.getUser(targetId);
        setUser(fetchedUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchUser();
    }
  }, [userId, autoFetch]);

  return {
    user,
    isLoading,
    error,
    refetch: () => fetchUser(),
  };
}

