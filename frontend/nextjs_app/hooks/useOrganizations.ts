/**
 * Hook for fetching and managing organizations
 */

'use client';

import { useState, useEffect } from 'react';
import { djangoClient } from '@/services/djangoClient';
import type { Organization, CreateOrganizationRequest } from '@/services/types';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        setIsLoading(true);
        const response = await djangoClient.organizations.listOrganizations();
        setOrganizations(response.results);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load organizations');
        setOrganizations([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganizations();
  }, []);

  const createOrganization = async (data: CreateOrganizationRequest) => {
    try {
      const newOrg = await djangoClient.organizations.createOrganization(data);
      setOrganizations([...organizations, newOrg]);
      return newOrg;
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
      throw err;
    }
  };

  const addMember = async (slug: string, userId: number, roleId: number) => {
    try {
      await djangoClient.organizations.addMember(slug, { user_id: userId, role_id: roleId });
      // Refetch to get updated member count
      const response = await djangoClient.organizations.listOrganizations();
      setOrganizations(response.results);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
      throw err;
    }
  };

  return {
    organizations,
    isLoading,
    error,
    createOrganization,
    addMember,
    refetch: () => {
      setIsLoading(true);
      return djangoClient.organizations.listOrganizations().then(response => {
        setOrganizations(response.results);
        setIsLoading(false);
      });
    },
  };
}
