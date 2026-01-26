/**
 * Dynamic Track Page
 * 
 * Curriculum track detail view with modules, progress, and next actions.
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurriculumProgress } from '@/hooks/useCurriculumProgress';
import { TrackShell } from '@/components/curriculum/TrackShell';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const trackCode = params?.trackCode as string;
  const { user, isLoading: authLoading } = useAuth();
  
  const {
    track,
    progress,
    subscriptionTier,
    nextAction,
    recentActivities,
    modules,
    loading,
    error,
    enrollInTrack,
    startModule,
  } = useCurriculumProgress(String(user?.id || ''), { trackCode });

  // Redirect to Tier 2 page if this is a Tier 2 track
  useEffect(() => {
    if (track && track.tier === 2) {
      router.replace(`/dashboard/student/curriculum/${trackCode}/tier2`);
    }
  }, [track, trackCode, router]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !track) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Track Not Found</h2>
          <p className="text-slate-400 mb-6">
            {error || `The track "${trackCode}" could not be loaded.`}
          </p>
          <Link href="/dashboard/student/curriculum">
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Curriculum
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-amber-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-6">
            Please log in to access curriculum content.
          </p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleModuleSelect = (moduleId: string) => {
    // Could navigate to module detail or expand inline
    console.log('Selected module:', moduleId);
  };

  return (
    <TrackShell
      track={track}
      progress={progress}
      modules={modules}
      subscriptionTier={subscriptionTier}
      nextAction={nextAction}
      recentActivities={recentActivities}
      onModuleSelect={handleModuleSelect}
      onEnroll={enrollInTrack}
      userId={String(user.id)}
    />
  );
}

