/**
 * TrackShell Component
 * 
 * Main container for the curriculum track view.
 * Includes sticky header with progress, next action CTA, and navigation.
 */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Flame, Medal, Crown, Users, Clock,
  Target, TrendingUp, Settings, ArrowLeft, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRiver } from './ProgressRiver';
import { RecentActivity } from './RecentActivity';
import { MentorNote } from './MentorNote';
import { CircularProgress } from './CircularProgress';
import type {
  CurriculumTrackDetail,
  UserTrackProgress,
  CurriculumModuleList,
  NextAction,
  CurriculumActivity,
  SubscriptionTier,
} from '@/services/types/curriculum';
import Link from 'next/link';

interface TrackShellProps {
  track: CurriculumTrackDetail;
  progress: UserTrackProgress | null;
  modules: (CurriculumModuleList & { isLocked: boolean; isCurrent: boolean })[];
  subscriptionTier: SubscriptionTier;
  nextAction: NextAction | null;
  recentActivities: CurriculumActivity[];
  onModuleSelect: (moduleId: string) => void;
  onEnroll: () => Promise<any>;
  userId: string;
}

export function TrackShell({
  track,
  progress,
  modules,
  subscriptionTier,
  nextAction,
  recentActivities,
  onModuleSelect,
  onEnroll,
  userId,
}: TrackShellProps) {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(
    progress?.current_module || modules[0]?.id || null
  );
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await onEnroll();
    } finally {
      setEnrolling(false);
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    setActiveModuleId(moduleId);
    onModuleSelect(moduleId);
  };

  const activeModule = modules.find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-indigo-900/50">
        <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8 max-w-6xl">
          {/* Back Navigation */}
          <div className="mb-4">
            <Link 
              href="/dashboard/student/curriculum" 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Curriculum</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center justify-between">
            {/* TRACK HEADER */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                <div className={`w-3 h-3 bg-gradient-to-r from-${track.color || 'emerald'}-400 to-${track.color || 'teal'}-400 rounded-full animate-pulse flex-shrink-0`} />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black bg-gradient-to-r from-indigo-400 via-white to-emerald-400 bg-clip-text text-transparent leading-tight truncate">
                  {track.name}
                </h1>
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm lg:text-lg text-slate-300">
                {progress ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-orange-400 rounded-full" />
                      <span>Circle {progress.circle_level}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-lg lg:text-2xl font-bold text-emerald-400">
                      <span>{Math.round(progress.completion_percentage)}%</span>
                      <div className="w-5 h-5 lg:w-6 lg:h-6 bg-emerald-400/20 rounded-lg flex items-center justify-center text-[10px] lg:text-xs">
                        ✓
                      </div>
                    </div>
                    {progress.estimated_completion_date && (
                      <div className="text-slate-400 hidden sm:block">
                        Est: {new Date(progress.estimated_completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-400">
                    {track.module_count} Modules • {track.lesson_count} Lessons • {track.estimated_duration_weeks} weeks
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 w-full lg:w-auto">
              {progress ? (
                <>
                  {nextAction && (
                    <Link href={nextAction.url}>
                      <Button 
                        size="lg" 
                        className="w-full sm:min-w-[200px] lg:min-w-[220px] h-12 lg:h-14 text-base lg:text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-300"
                      >
                        <span className="mr-2">{nextAction.icon}</span>
                        {nextAction.label}
                      </Button>
                    </Link>
                  )}
                  
                  {subscriptionTier === 'starter_normal' && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="h-12 lg:h-14 border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:bg-indigo-500/10 text-indigo-300 font-bold w-full sm:min-w-[180px] lg:min-w-[200px]"
                    >
                      🔓 Upgrade (KSh 793/mo)
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full sm:min-w-[200px] h-12 lg:h-14 text-base lg:text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-300"
                >
                  {enrolling ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Enrolling...
                    </>
                  ) : (
                    <>🚀 Enroll in Track</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* MINI STATS (when enrolled) */}
          {progress && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:flex items-center gap-8 mt-6 pt-6 border-t border-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{progress.current_streak_days}</div>
                  <div className="text-xs text-slate-400">Day Streak</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{progress.total_points}</div>
                  <div className="text-xs text-slate-400">Points</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                  <Medal className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{progress.total_badges}</div>
                  <div className="text-xs text-slate-400">Badges</div>
                </div>
              </div>
              
              {progress.university_rank && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">#{progress.university_rank}</div>
                    <div className="text-xs text-slate-400">Uni Rank</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{Math.round(progress.total_time_spent_minutes / 60)}h</div>
                  <div className="text-xs text-slate-400">Time Spent</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 lg:px-6 pb-24 max-w-6xl">
        {/* PROGRESS RIVER */}
        <div className="py-8 lg:py-12">
          <ProgressRiver 
            modules={modules}
            subscriptionTier={subscriptionTier}
            onModuleSelect={handleModuleSelect}
            activeModuleId={activeModuleId}
            trackCode={track.code}
          />
        </div>

        {/* MENTOR NOTE (Professional tier only) */}
        {activeModule && subscriptionTier === 'professional' && (
          <MentorNote 
            moduleId={activeModuleId || ''}
            moduleTitle={activeModule.title}
          />
        )}

        {/* RECENT ACTIVITY */}
        {recentActivities.length > 0 && (
          <RecentActivity 
            activities={recentActivities}
            trackCode={track.code}
          />
        )}

        {/* RECIPE ENGINE PROMO (if not professional) */}
        {subscriptionTier !== 'professional' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-amber-500/10 via-transparent to-transparent border border-amber-500/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-20 h-20 lg:w-24 lg:h-24 text-amber-400" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-black text-xs uppercase tracking-widest">Recipe Engine</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-wide">Feeling stuck on a mission?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Bridge technical gaps with micro-skill boosters. Focused, step-by-step guides contextually available for your current track tasks.
                </p>
              </div>
              <Link href="/dashboard/student/coaching/recipes">
                <Button 
                  variant="gold"
                  className="bg-amber-500 text-slate-900 font-black uppercase text-xs hover:bg-amber-400"
                >
                  Browse Recipes
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

