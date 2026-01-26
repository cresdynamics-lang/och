/**
 * Hook for fetching and managing users (admin only)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { djangoClient } from '@/services/djangoClient';
import type { User } from '@/services/types';

export interface UseUsersParams {
  page?: number;
  page_size?: number;
  role?: string;
  search?: string;
}

export function useUsers(params?: UseUsersParams) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await djangoClient.users.listUsers(params);
      setUsers(response.results || []);
      setTotalCount(response.count || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.page_size, params?.role, params?.search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = async (id: number, data: Partial<User>) => {
    try {
      const updated = await djangoClient.users.updateUser(id, data);
      setUsers(users.map(u => u.id === id ? updated : u));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      throw err;
    }
  };

  const refetch = useCallback(() => {
    return fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    totalCount,
    isLoading,
    error,
    updateUser,
    refetch,
  };
}

