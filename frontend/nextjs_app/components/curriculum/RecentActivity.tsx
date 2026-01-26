/**
 * RecentActivity Component
 * 
 * Displays recent curriculum activities with visual timeline.
 */
'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle2, Play, Trophy, Target, Flame,
  BookOpen, Zap, Award, Clock, TrendingUp
} from 'lucide-react';
import type { CurriculumActivity, ActivityType } from '@/services/types/curriculum';

interface RecentActivityProps {
  activities: CurriculumActivity[];
  trackCode?: string;
  maxItems?: number;
}

const activityConfig: Record<ActivityType, { icon: React.ReactNode; color: string; label: string }> = {
  lesson_started: { icon: <Play className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/20', label: 'Started Lesson' },
  lesson_completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/20', label: 'Completed Lesson' },
  module_started: { icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-indigo-400 bg-indigo-500/20', label: 'Started Module' },
  module_completed: { icon: <Trophy className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/20', label: 'Completed Module' },
  mission_started: { icon: <Target className="w-3.5 h-3.5" />, color: 'text-orange-400 bg-orange-500/20', label: 'Started Mission' },
  mission_submitted: { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-yellow-400 bg-yellow-500/20', label: 'Submitted Mission' },
  mission_completed: { icon: <Trophy className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/20', label: 'Completed Mission' },
  quiz_completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-purple-400 bg-purple-500/20', label: 'Completed Quiz' },
  recipe_started: { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-500/20', label: 'Started Recipe' },
  recipe_completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-500/20', label: 'Completed Recipe' },
  track_started: { icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-indigo-400 bg-indigo-500/20', label: 'Enrolled in Track' },
  track_completed: { icon: <Award className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/20', label: 'Completed Track' },
  streak_milestone: { icon: <Flame className="w-3.5 h-3.5" />, color: 'text-orange-400 bg-orange-500/20', label: 'Streak Milestone' },
  badge_earned: { icon: <Award className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/20', label: 'Badge Earned' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActivityTitle(activity: CurriculumActivity): string {
  if (activity.lesson_title) return activity.lesson_title;
  if (activity.module_title) return activity.module_title;
  if (activity.track_name) return activity.track_name;
  if (activity.metadata?.badge_name) return activity.metadata.badge_name;
  if (activity.metadata?.score) return `Score: ${activity.metadata.score}`;
  return '';
}

export function RecentActivity({ activities, trackCode, maxItems = 5 }: RecentActivityProps) {
  if (!activities || activities.length === 0) return null;

  const displayActivities = activities.slice(0, maxItems);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 lg:mt-12"
    >
      {/* Header */}
      <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="w-px h-6 lg:h-8 bg-gradient-to-b from-emerald-400 to-transparent" />
        <h3 className="text-lg lg:text-xl xl:text-2xl font-black text-slate-200">Recent Activity</h3>
      </div>

      {/* Activity List */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl lg:rounded-2xl overflow-hidden">
        {displayActivities.map((activity, index) => {
          const config = activityConfig[activity.activity_type] || {
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            color: 'text-slate-400 bg-slate-500/20',
            label: 'Activity'
          };
          const title = getActivityTitle(activity);

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 lg:gap-4 p-3 lg:p-4 
                hover:bg-slate-800/30 transition-colors
                ${index < displayActivities.length - 1 ? 'border-b border-slate-800/50' : ''}
              `}
            >
              {/* Icon */}
              <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs lg:text-sm font-medium ${config.color.split(' ')[0]}`}>
                    {config.label}
                  </span>
                  {activity.points_awarded > 0 && (
                    <span className="text-[10px] lg:text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
                      +{activity.points_awarded} pts
                    </span>
                  )}
                </div>
                {title && (
                  <div className="text-sm lg:text-base text-slate-300 truncate">
                    {title}
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="text-[10px] lg:text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(activity.created_at)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View All Link */}
      {activities.length > maxItems && (
        <div className="mt-3 lg:mt-4 text-center">
          <button className="text-xs lg:text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            View all activity →
          </button>
        </div>
      )}
    </motion.div>
  );
}

