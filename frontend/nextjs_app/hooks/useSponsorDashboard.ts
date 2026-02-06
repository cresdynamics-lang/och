/**
 * Sponsor Dashboard Data Hook
 * Uses SWR for caching and automatic revalidation
 */

import useSWR from 'swr';
import type { SponsorDashboardResponse } from '@/types/sponsor';

const SPONSOR_DASHBOARD_CACHE_KEY = 'sponsor-dashboard';

// Custom fetcher function
const fetcher = async (url: string): Promise<SponsorDashboardResponse> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `Failed to fetch sponsor dashboard: ${response.status}`);
  }

  return response.json();
};

export function useSponsorDashboard(orgId: string) {
  const url = `/api/sponsor/${orgId}/dashboard`;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: refetch
  } = useSWR<SponsorDashboardResponse>(
    orgId ? url : null, // Only fetch if orgId is provided
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: true, // Refetch on network reconnection
      dedupingInterval: 30000, // Dedupe requests within 30 seconds
      errorRetryCount: 3, // Retry failed requests 3 times
      errorRetryInterval: 1000, // Wait 1 second between retries
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      onError: (err) => {
        console.error('Sponsor dashboard fetch error:', err);
      },
      onSuccess: (data) => {
        console.log('Sponsor dashboard data loaded:', {
          orgId,
          sponsorName: data.sponsor.name,
          cohortsCount: data.cohorts.length,
          totalValue: data.summary.totalValueCreated
        });
      }
    }
  );

  // Calculate derived data
  const totalSeats = data?.summary.totalSeatsSponsored || 0;
  const seatsUsed = data?.summary.seatsUsed || 0;
  const utilizationRate = totalSeats > 0 ? seatsUsed / totalSeats : 0;

  const atRiskCohorts = data?.cohorts.filter(cohort =>
    cohort.riskLevel === 'at_risk'
  ) || [];

  const warningCohorts = data?.cohorts.filter(cohort =>
    cohort.riskLevel === 'warning'
  ) || [];

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    isValidating,
    refetch,
    // Derived data
    utilizationRate,
    atRiskCohorts,
    warningCohorts,
    // Helper functions
    getCohortById: (cohortId: string) => {
      return data?.cohorts.find(cohort => cohort.cohortId === cohortId);
    },
    getPartnerByName: (name: string) => {
      return data?.employers.partners.find(partner => partner.name === name);
    },
    // Cache key for manual cache management
    cacheKey: `${SPONSOR_DASHBOARD_CACHE_KEY}-${orgId}`
  };
}

// Hook for specific cohort data (can be used in cohort details modal)
export function useCohortData(orgId: string, cohortId: string) {
  const { data: dashboardData } = useSponsorDashboard(orgId);

  const cohort = dashboardData?.cohorts.find(c => c.cohortId === cohortId);

  return {
    cohort,
    isLoading: !dashboardData && !cohort,
    error: cohort ? null : new Error('Cohort not found')
  };
}

// Hook for export functionality
export function useSponsorExport(orgId: string) {
  const exportFetcher = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    // For PDF/CSV exports, we expect a download URL or blob
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/pdf') || contentType?.includes('text/csv')) {
      // Handle binary download
      const blob = await response.blob();
      return { blob, contentType, filename: response.headers.get('content-disposition')?.split('filename=')[1] };
    }

    // Handle JSON response with download URL
    return response.json();
  };

  const exportROI = (format: 'pdf' | 'csv' = 'pdf') => {
    return exportFetcher(`/api/sponsor/${orgId}/reports/roi-${format}`);
  };

  const exportCohorts = () => {
    return exportFetcher(`/api/sponsor/${orgId}/reports/cohorts.csv`);
  };

  const exportPlacements = () => {
    return exportFetcher(`/api/sponsor/${orgId}/reports/placements.pdf`);
  };

  return {
    exportROI,
    exportCohorts,
    exportPlacements
  };
}

// Hook for actions (support requests, seat increases, HR invitations)
export function useSponsorActions(orgId: string) {
  const actionFetcher = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Action failed' }));
      throw new Error(errorData.message || `Action failed: ${response.status}`);
    }

    return response.json();
  };

  const requestSupport = async (cohortId: string, issueType: string, description: string) => {
    return actionFetcher(`/api/sponsor/${orgId}/support-request`, {
      body: JSON.stringify({
        cohortId,
        issueType,
        description
      })
    });
  };

  const increaseSeats = async (additionalSeats: number, justification: string) => {
    return actionFetcher(`/api/sponsor/${orgId}/seats/recommendation-accept`, {
      body: JSON.stringify({
        additionalSeats,
        justification
      })
    });
  };

  const inviteHR = async (emails: string[], message?: string) => {
    return actionFetcher(`/api/sponsor/${orgId}/invite-hr`, {
      body: JSON.stringify({
        emails,
        message
      })
    });
  };

  return {
    requestSupport,
    increaseSeats,
    inviteHR
  };
}
