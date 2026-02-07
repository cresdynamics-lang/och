'use client';

import React, { useEffect, useMemo, Suspense, lazy } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSponsorDashboard } from '@/hooks/useSponsorDashboard';

// Lazy load heavy components for better performance
const SponsorHero = lazy(() => import('@/components/sponsor/SponsorHero'));
const CohortPerformance = lazy(() => import('@/components/sponsor/CohortPerformance'));
const SkillsOutcomes = lazy(() => import('@/components/sponsor/SkillsOutcomes'));
const EmployerSignals = lazy(() => import('@/components/sponsor/EmployerSignals'));
const SponsorActions = lazy(() => import('@/components/sponsor/SponsorActions'));

const SponsorDashboardPage = React.memo(function SponsorDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const orgId = params.orgId as string;

  // Memoize expensive calculations
  const hasSponsorRole = useMemo(() => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      typeof role === 'string'
        ? role === 'sponsor' || role === 'sponsor_admin'
        : role?.role === 'sponsor' || role?.role === 'sponsor_admin'
    );
  }, [user?.roles]);

  // Authentication guard - only sponsors can access
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/sponsor');
      return;
    }

    if (!authLoading && isAuthenticated && user) {
      const hasSponsorRole = user.roles?.some(role =>
        typeof role === 'string'
          ? role === 'sponsor' || role === 'sponsor_admin'
          : role?.role === 'sponsor' || role?.role === 'sponsor_admin'
      );

      if (!hasSponsorRole) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { data, isLoading, error, refetch } = useSponsorDashboard(orgId);

  // Show loading state while checking authentication
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show unauthorized if not a sponsor
  if (!hasSponsorRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-slate-400 mb-6">
              You don't have permission to access this sponsor dashboard.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Go Home
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Dashboard</h2>
            <p className="text-slate-400 mb-6">
              {error instanceof Error ? error.message : 'Failed to load dashboard data'}
            </p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-4"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
            >
              Go Home
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero ROI Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-slate-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={
            <Card className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-16 w-96" />
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                </div>
              </div>
            </Card>
          }>
            {isLoading || !data ? (
              <Card className="p-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-16 w-96" />
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-12 w-32" />
                  </div>
                </div>
              </Card>
            ) : (
              <SponsorHero sponsor={data.sponsor} summary={data.summary} />
            )}
          </Suspense>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {isLoading || !data ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 space-y-6">
              <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
              <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </Card>
            </div>
            <div className="xl:col-span-1 space-y-6">
              <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </Card>
              <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 space-y-6">
              <Suspense fallback={<Card className="p-6"><Skeleton className="h-32 w-full" /></Card>}>
                <CohortPerformance cohorts={data.cohorts} />
              </Suspense>
              <Suspense fallback={<Card className="p-6"><Skeleton className="h-64 w-full" /></Card>}>
                <SkillsOutcomes skills={data.skills} />
              </Suspense>
            </div>
            <div className="xl:col-span-1 space-y-6">
              <Suspense fallback={<Card className="p-6"><Skeleton className="h-48 w-full" /></Card>}>
                <EmployerSignals employers={data.employers} />
              </Suspense>
              <Suspense fallback={<Card className="p-6"><Skeleton className="h-40 w-full" /></Card>}>
                <SponsorActions
                  summary={data.summary}
                  actions={data.actions}
                  cohorts={data.cohorts}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SponsorDashboardPage.displayName = 'SponsorDashboardPage';

export default SponsorDashboardPage;

