'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Lock, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface CurriculumGuardProps {
  children: React.ReactNode;
  requiredEnrollment?: boolean;
  requiredLevel?: string;
  requiredTier?: 'free' | 'professional';
  trackSlug?: string;
}

export function CurriculumGuard({
  children,
  requiredEnrollment = false,
  requiredLevel,
  requiredTier = 'free',
  trackSlug
}: CurriculumGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [accessReason, setAccessReason] = useState<string>('');

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      setAccessReason('authentication');
      setHasAccess(false);
      return;
    }

    // Check enrollment requirement
    if (requiredEnrollment && trackSlug) {
      // Mock enrollment check - replace with actual API call
      const isEnrolled = trackSlug === 'defender'; // Mock: only defender track has enrollment
      if (!isEnrolled) {
        setAccessReason('enrollment');
        setHasAccess(false);
        return;
      }
    }

    // Check level progression
    if (requiredLevel) {
      // Mock level check - replace with actual API call
      const userProgress = {
        currentLevel: 'beginner',
        completedLevels: ['beginner']
      };

      const levelOrder = ['beginner', 'intermediate', 'advanced', 'mastery'];
      const requiredIndex = levelOrder.indexOf(requiredLevel);
      const currentIndex = levelOrder.indexOf(userProgress.currentLevel);

      if (requiredIndex > currentIndex + 1) { // Can access current + next level
        setAccessReason('level');
        setHasAccess(false);
        return;
      }
    }

    // Check tier requirement
    if (requiredTier === 'professional') {
      // Mock tier check - replace with actual subscription API
      const userTier = 'free'; // Mock: user is on free tier
      if (userTier !== 'professional') {
        setAccessReason('tier');
        setHasAccess(false);
        return;
      }
    }

    // All checks passed
    setHasAccess(true);
  }, [isAuthenticated, user, isLoading, requiredEnrollment, requiredLevel, requiredTier, trackSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-slate-900/50 border-slate-700 text-center">
          {accessReason === 'authentication' && (
            <>
              <Shield className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
              <p className="text-slate-300 mb-6">
                Please sign in to access this curriculum content.
              </p>
              <div className="space-y-3">
                <Link href="/login/student">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup/student">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                    Create Account
                  </Button>
                </Link>
              </div>
            </>
          )}

          {accessReason === 'enrollment' && (
            <>
              <Lock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Enrollment Required</h2>
              <p className="text-slate-300 mb-6">
                You need to enroll in this track to access its content.
              </p>
              <div className="space-y-3">
                <Link href={`/curriculum/track/${trackSlug}`}>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    View Track Details
                  </Button>
                </Link>
                <Link href="/curriculum">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                    Browse Other Tracks
                  </Button>
                </Link>
              </div>
            </>
          )}

          {accessReason === 'level' && (
            <>
              <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Level Locked</h2>
              <p className="text-slate-300 mb-6">
                Complete the previous level to unlock this content.
              </p>
              <div className="space-y-3">
                <Link href={`/curriculum/learn/${trackSlug}`}>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Continue Learning
                  </Button>
                </Link>
                <Link href={`/curriculum/track/${trackSlug}`}>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                    View Progress
                  </Button>
                </Link>
              </div>
            </>
          )}

          {accessReason === 'tier' && (
            <>
              <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Professional Tier Required</h2>
              <p className="text-slate-300 mb-6">
                This content requires a Professional subscription.
              </p>
              <div className="space-y-3">
                <Link href="/pricing">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Upgrade to Pro
                  </Button>
                </Link>
                <Link href={`/curriculum/learn/${trackSlug}`}>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                    View Free Content
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
