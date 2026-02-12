/**
 * Student Dashboard Client
 * Orchestrates the Mission Control interface.
 * The sidebar and navigation are handled by the parent StudentLayout.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fastapiClient } from '@/services/fastapiClient';
import { foundationsClient } from '@/services/foundationsClient';
import { StudentDashboardHub } from './components/StudentDashboardHub';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

export default function StudentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, reloadUser } = useAuth();
  const [checkingProfiling, setCheckingProfiling] = useState(true);
  const [checkingFoundations, setCheckingFoundations] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check if user is authenticated
    // Add a small delay to prevent premature redirects during auth loading
    if (authLoading || !isAuthenticated || !user) {
      console.log('StudentClient: Waiting for auth to load...', { authLoading, isAuthenticated, user: !!user });
      return;
    }

    // Prevent multiple checks
    if (hasCheckedRef.current) {
      return;
    }

    // Mark as checked immediately to prevent re-runs
    hasCheckedRef.current = true;

    // Check if user is a student/mentee
    const userRoles = user?.roles || [];
    const isStudent = userRoles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase();
      return roleName === 'student' || roleName === 'mentee';
    });

    if (!isStudent) {
      console.log('StudentClient: User is not a student/mentee, allowing access without checks');
      setCheckingProfiling(false);
      return;
    }

    console.log('StudentClient: User is student/mentee, proceeding with checks');

    // Check profiling status - fetch fresh status from Django API
    const checkProfiling = async () => {
      try {
        // CRITICAL: Fetch fresh user data directly from Django API
        // This ensures admin resets are immediately respected
        const { djangoClient } = await import('@/services/djangoClient');
        let currentProfilingComplete = user.profiling_complete;
        
        try {
          console.log('StudentClient: Fetching fresh user data from Django...');
          const freshUser = await djangoClient.auth.getCurrentUser();
          currentProfilingComplete = freshUser?.profiling_complete ?? false;
          console.log('StudentClient: Fresh profiling_complete =', currentProfilingComplete);

          // Don't call reloadUser here - it causes infinite loops
        } catch (err) {
          console.log('StudentClient: Failed to fetch fresh user, using cached data');
        }
        
        // Check Django's profiling_complete as SOURCE OF TRUTH
        if (!currentProfilingComplete) {
          console.log('✅ Django profiling_complete=false - redirecting to profiler');
          router.push('/onboarding/ai-profiler');
          return;
        }
        
        // Django says profiling is complete - TRUST IT, don't check FastAPI
        // FastAPI may have stale session data that conflicts with Django
        console.log('✅ Django profiling_complete=true - profiling verified complete');
        
        setCheckingProfiling(false);
        setCheckingFoundations(true);
        
        // Now check Foundations
        await checkFoundations();
      } catch (error: any) {
        console.error('❌ Failed to check profiling status:', error);
        
        // On any error, redirect to profiler if profiling not complete
        if (!user.profiling_complete) {
          router.push('/onboarding/ai-profiler');
          return;
        }
        
        // Allow access if Django says complete
        setCheckingProfiling(false);
        setCheckingFoundations(true);
        await checkFoundations();
      }
    };

    const checkFoundations = async () => {
      try {
        // Check URL param first - if redirected from foundations completion, trust it
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('foundations_complete') === 'true') {
          console.log('✅ Foundations just completed (URL param) - allowing access');
          setCheckingFoundations(false);
          return;
        }

        // CRITICAL: Fetch fresh user data from Django for foundations status
        // The cached user object may be stale
        const { djangoClient } = await import('@/services/djangoClient');
        let currentFoundationsComplete = user.foundations_complete;
        
        try {
          const freshUser = await djangoClient.auth.getCurrentUser();
          currentFoundationsComplete = freshUser?.foundations_complete ?? false;
          console.log('StudentClient: Fresh foundations_complete =', currentFoundationsComplete);
        } catch (err) {
          console.log('StudentClient: Failed to fetch fresh user for foundations check');
        }

        if (currentFoundationsComplete) {
          console.log('✅ Foundations already completed (Django confirmed)');
          setCheckingFoundations(false);
          return;
        }

        // Check Foundations status from API
        try {
          const foundationsStatus = await foundationsClient.getStatus();
          
          if (!foundationsStatus.foundations_available) {
            console.log('⚠️ Foundations not available:', foundationsStatus);
            // Don't redirect to profiler - we already confirmed profiling is complete above
            // Just allow access to dashboard
            setCheckingFoundations(false);
            return;
          }

          // If Foundations is not complete, redirect to Foundations
          if (!foundationsStatus.is_complete) {
            console.log('✅ Foundations not completed - redirecting to Foundations');
            router.push('/dashboard/student/foundations');
            return;
          }

          console.log('✅ Foundations completed');
        } catch (foundationsError) {
          console.error('⚠️ Failed to check foundations status:', foundationsError);
          // On error, allow access - don't block the dashboard
        }

        setCheckingFoundations(false);
      } catch (error: any) {
        console.error('❌ Failed to check Foundations status:', error);
        // On error, allow access but log it
        setCheckingFoundations(false);
      }
    };

    checkProfiling();
  }, [isAuthenticated, authLoading, user]);

  // Show loading while checking profiling or foundations
  // This prevents dashboard from rendering and making API calls before redirect
  if ((checkingProfiling || checkingFoundations) && isAuthenticated) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-och-defender animate-spin mx-auto" />
            <div className="text-white text-lg">
              {checkingProfiling ? 'Checking profiling status...' : 'Checking Foundations status...'}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Always show the new dashboard - redirects happen in background
  return (
    <ErrorBoundary>
      <StudentDashboardHub />
    </ErrorBoundary>
  );
}
