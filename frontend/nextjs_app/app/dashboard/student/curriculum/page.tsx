'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  FileText,
  Rocket,
  Award,
  BookOpen,
  Users,
  Clock,
  Lock,
  CheckCircle,
  Star,
  ChevronRight,
  Play,
  TrendingUp,
  Target,
  Map as MapIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { curriculumClient } from '@/services/curriculumClient';
import Link from 'next/link';

interface CurriculumTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string;
  order_number: number;
  levels_count: number;
  total_duration_hours: number;
  user_enrollment: {
    enrolled: boolean;
    current_level?: string;
    progress_percent?: number;
  };
}

// Track configurations
const TRACK_CONFIGS = {
  defender: {
    icon: Shield,
    color: 'red',
    gradient: 'from-red-500/20 via-red-600/10 to-slate-900/30',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/20'
  },
  offensive: {
    icon: Zap,
    color: 'orange',
    gradient: 'from-orange-500/20 via-orange-600/10 to-slate-900/30',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/20'
  },
  grc: {
    icon: FileText,
    color: 'emerald',
    gradient: 'from-emerald-500/20 via-emerald-600/10 to-slate-900/30',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20'
  },
  innovation: {
    icon: Rocket,
    color: 'cyan',
    gradient: 'from-cyan-500/20 via-cyan-600/10 to-slate-900/30',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20'
  },
  leadership: {
    icon: Award,
    color: 'gold',
    gradient: 'from-amber-500/20 via-amber-600/10 to-slate-900/30',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20'
  }
};

interface TrackCardProps {
  track: CurriculumTrack;
  isRecommended?: boolean;
}

function TrackCard({ track, isRecommended }: TrackCardProps) {
  const config = TRACK_CONFIGS[track.slug as keyof typeof TRACK_CONFIGS] || TRACK_CONFIGS.defender;
  const IconComponent = config.icon;
  const enrollment = track.user_enrollment;

  const progressPercentage = enrollment.progress_percent || 0;
  const isEnrolled = enrollment.enrolled;
  const isLocked = false; // For now, all tracks are available

  return (
    <div className="hover:scale-105 hover:-translate-y-1 transition-all duration-200">
      <Card className={`
        p-4 bg-gradient-to-br ${config.gradient}
        border ${config.borderColor} hover:shadow-xl
        transition-all duration-300 h-full relative overflow-hidden
      `}>
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs flex items-center gap-1 px-2 py-1">
              <Star className="w-3 h-3" />
              Recommended
            </Badge>
          </div>
        )}

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 font-semibold text-sm">Professional Tier</p>
              <p className="text-slate-500 text-xs">Required</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} ${config.borderColor} border flex items-center justify-center flex-shrink-0`}>
            <IconComponent className={`w-5 h-5 ${config.textColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white mb-1 truncate">
              {track.title}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-2 mb-2">
              {track.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {track.levels_count} Levels
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {track.total_duration_hours}h
              </span>
            </div>

            {/* Enrollment Status */}
            {isEnrolled && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Progress: {Math.round(progressPercentage)}%</span>
                  <span>{enrollment.current_level}</span>
                </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-slate-400">
            {isEnrolled ? 'Continue Learning' : 'Start Track'}
          </div>
          <Link
            href={`/dashboard/student/curriculum/learn`}
            onClick={() => localStorage.setItem('current_learning_track', track.slug)}
          >
            <Button
              size="sm"
              className={`bg-transparent border ${config.borderColor} ${config.textColor} hover:bg-white/10 text-xs px-3 py-1 h-7`}
              disabled={isLocked}
            >
              {isEnrolled ? 'Continue' : 'Explore'}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function CurriculumHubPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedTrack, setRecommendedTrack] = useState<string | null>(null);

  useEffect(() => {
    const loadTracks = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load tracks from API
        const tracksData = await curriculumClient.getTracks();

        // Transform API data to match component format
        const formattedTracks: CurriculumTrack[] = tracksData.map((track: any) => ({
          id: track.id || track.code,
          slug: track.code || track.slug,
          title: track.name || track.title,
          description: track.description || '',
          thumbnail_url: track.thumbnail_url || '',
          order_number: track.order || track.order_number || 0,
          levels_count: track.levels_count || 4,
          total_duration_hours: track.total_duration_hours || 40,
          user_enrollment: {
            enrolled: track.is_enrolled || false,
            current_level: track.current_level || 'beginner',
            progress_percent: track.progress_percentage || track.progress_percent || 0
          }
        }));

        setTracks(formattedTracks);

        // Set recommended track from user profile or first enrolled track
        const enrolledTrack = formattedTracks.find(t => t.user_enrollment.enrolled);
        if (enrolledTrack) {
          setRecommendedTrack(enrolledTrack.slug);
        } else if (formattedTracks.length > 0) {
          setRecommendedTrack(formattedTracks[0].slug);
        }

      } catch (err: any) {
        console.error('Failed to load tracks:', err);
        setError('Failed to load curriculum tracks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, [isAuthenticated]);

  // All tracks are freely available
  const enrolledTracks = tracks.filter(track => track.user_enrollment.enrolled);
  const availableTracks = tracks.filter(track => !track.user_enrollment.enrolled);

  // Wait for auth to load before checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">{authLoading ? 'Loading...' : 'Loading Curriculum Hub...'}</p>
        </div>
      </div>
    );
  }

  // Check for token even if isAuthenticated is false (might be loading)
  const hasToken = typeof window !== 'undefined' && (
    localStorage.getItem('access_token') ||
    document.cookie.includes('access_token=')
  );

  // Only show login prompt if auth has finished loading AND there's no token
  // If auth is still loading or token exists, allow access
  if (!authLoading && !isAuthenticated && !hasToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-slate-500" />
          <h2 className="text-2xl font-bold mb-2 text-white">Authentication Required</h2>
          <p className="text-slate-400 mb-6">
            Please log in to access the curriculum
          </p>
          <Button onClick={() => window.location.href = '/login/student'} variant="defender">
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Error Loading Tracks</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-transparent to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-8 h-8 text-indigo-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Curriculum <span className="text-indigo-400">Hub</span>
              </h1>
            </div>

            <p className="text-base sm:text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              Master cybersecurity through structured learning paths designed for every career stage
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{tracks.length} Specialized Tracks</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{tracks.reduce((acc, t) => acc + t.levels_count, 0)} Comprehensive Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{tracks.reduce((acc, t) => acc + t.total_duration_hours, 0)}+ Hours of Content</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Active Tracks */}
        {enrolledTracks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Your Active Tracks</h2>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                {enrolledTracks.length} Enrolled
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isRecommended={track.slug === recommendedTrack}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Track */}
        {recommendedTrack && !enrolledTracks.find(t => t.slug === recommendedTrack) && (
          <div>
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Recommended for You</h3>
              </div>
              <p className="text-sm text-slate-300 mb-3">
                Based on your profile, we recommend starting with the Defender Track to build strong foundational security skills.
              </p>
              {(() => {
                const recommendedTrackData = tracks.find(t => t.slug === recommendedTrack);
                return recommendedTrackData ? (
                  <TrackCard track={recommendedTrackData} isRecommended />
                ) : null;
              })()}
            </Card>
          </div>
        )}

        {/* All Available Tracks */}
        {availableTracks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Explore All Tracks</h2>
              <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                {availableTracks.length} Available
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isRecommended={track.slug === recommendedTrack}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="text-center">
          <Card className="p-4 bg-slate-900/50 border border-slate-700 max-w-xl mx-auto">
            <TrendingUp className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">Your Learning Journey</h3>
            <p className="text-xs text-slate-300 mb-3">
              Choose your path and start building the cybersecurity skills that matter most to your career goals.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-emerald-400">{enrolledTracks.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Active Tracks</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-400">
                  {enrolledTracks.length > 0
                    ? Math.round(enrolledTracks.reduce((acc, track) => acc + (track.user_enrollment.progress_percent || 0), 0) / enrolledTracks.length)
                    : 0}%
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Avg Progress</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">
                  {tracks.reduce((acc, track) => acc + track.total_duration_hours, 0)}h
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Total Content</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
