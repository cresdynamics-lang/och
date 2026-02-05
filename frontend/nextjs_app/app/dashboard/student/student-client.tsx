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

    // Check if user is a student/mentee
    const userRoles = user?.roles || [];
    const isStudent = userRoles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : (r?.role || r?.name || '').toLowerCase();
      return roleName === 'student' || roleName === 'mentee';
    });

    if (!isStudent) {
      console.log('StudentClient: User is not a student/mentee, allowing access without checks');
      setCheckingProfiling(false);
      hasCheckedRef.current = true;
      return;
    }

    console.log('StudentClient: User is student/mentee, proceeding with checks');

    // Check FastAPI profiling status
    const checkProfiling = async () => {
      try {
        const status = await fastapiClient.profiling.checkStatus();
        
        if (!status.completed) {
          console.log('✅ Profiling not completed - redirecting to FastAPI profiling');
          router.push('/onboarding/ai-profiler');
          return;
        }
        
        console.log('✅ Profiling completed');
        setCheckingProfiling(false);
        setCheckingFoundations(true);
        
        // Now check Foundations
        await checkFoundations();
      } catch (error: any) {
        console.error('❌ Failed to check profiling status:', error);
        
        // Fallback: Check Django user.profiling_complete field
        if (!user.profiling_complete) {
          console.log('✅ User profiling_complete=false, redirecting to profiler');
          router.push('/onboarding/ai-profiler');
          return;
        }
        
        // If user.profiling_complete=true, allow access (FastAPI down but user already completed)
        console.log('⚠️ FastAPI down but user.profiling_complete=true, allowing access');
        setCheckingProfiling(false);
        setCheckingFoundations(true);
        await checkFoundations();
      }
    };

    const checkFoundations = async () => {
      try {
        // Check if foundations_complete flag is set on user (from Django)
        if (user.foundations_complete) {
          console.log('✅ Foundations already completed');
          setCheckingFoundations(false);
          hasCheckedRef.current = true;
          return;
        }

        // Check Foundations status from API
        const foundationsStatus = await foundationsClient.getStatus();
        
        if (!foundationsStatus.foundations_available) {
          console.log('⚠️ Foundations not available:', foundationsStatus);
          
          // If profiling is not complete, redirect to profiler
          if (foundationsStatus.reason === 'profiling_incomplete') {
            console.log('✅ Redirecting to AI profiler (profiling incomplete)');
            router.push('/onboarding/ai-profiler');
            return;
          }
          
          // Otherwise, just allow access (edge case)
          setCheckingFoundations(false);
          hasCheckedRef.current = true;
          return;
        }

        // If Foundations is not complete, redirect to Foundations
        if (!foundationsStatus.is_complete) {
          console.log('✅ Foundations not completed - redirecting to Foundations');
          router.push('/dashboard/student/foundations');
          return;
        }

        // If complete but user flag not updated, refresh user (fire and forget)
        if (foundationsStatus.is_complete && !user.foundations_complete) {
          if (reloadUser) {
            reloadUser().catch(console.error);
          }
        }

        console.log('✅ Foundations completed');
        setCheckingFoundations(false);
        hasCheckedRef.current = true;
      } catch (error: any) {
        console.error('❌ Failed to check Foundations status:', error);
        // On error, allow access but log it
        setCheckingFoundations(false);
        hasCheckedRef.current = true;
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
