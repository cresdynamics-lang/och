'use client';

import { useState } from 'react';
import { ChevronLeft, Shield, Clock, Play, CheckCircle, Lock, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useDefenderCurriculum, useDefenderProgress, useAuth } from '@/hooks/useCurriculum';
import AiCoachStrip from '@/components/curriculum/AiCoachStrip';
import { Users, Hash, MessageSquare } from 'lucide-react';

const LEVEL_CONFIGS = {
  beginner: {
    icon: '🎓',
    color: 'blue',
    gradient: 'from-blue-500/20 via-blue-600/10 to-slate-900/30',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  intermediate: {
    icon: '⚡',
    color: 'green',
    gradient: 'from-green-500/20 via-green-600/10 to-slate-900/30',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  advanced: {
    icon: '🚀',
    color: 'orange',
    gradient: 'from-orange-500/20 via-orange-600/10 to-slate-900/30',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/20'
  },
  mastery: {
    icon: '👑',
    color: 'gold',
    gradient: 'from-amber-500/20 via-amber-600/10 to-slate-900/30',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20'
  }
};

function LevelCard({ level, progress }: { level: any, progress?: any }) {
  const config = LEVEL_CONFIGS[level.slug as keyof typeof LEVEL_CONFIGS] || LEVEL_CONFIGS.beginner;
  const levelProgress = progress?.find((p: any) => p.level_slug === level.slug);

  const progressPercentage = levelProgress?.percent_complete || 0;
  const isCompleted = progressPercentage === 100;
  const isInProgress = progressPercentage > 0 && progressPercentage < 100;
  const isLocked = false; // For now, all levels are unlocked

  return (
    <div className="hover:scale-105 hover:-translate-y-1 transition-all duration-200">
      <Card className={`
        p-6 bg-gradient-to-br ${config.gradient}
        border ${config.borderColor} hover:shadow-xl
        transition-all duration-300 h-full relative overflow-hidden
      `}>
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 font-semibold text-sm">Complete Previous Level</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4 mb-4">
          {/* Level Icon */}
          <div className={`w-12 h-12 rounded-lg ${config.bgColor} ${config.borderColor} border flex items-center justify-center flex-shrink-0`}>
            <span className="text-2xl">{config.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-white truncate">
                {level.title}
              </h3>
              {isCompleted && (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
              {isInProgress && (
                <Play className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
            </div>

            <p className="text-sm text-slate-300 line-clamp-2 mb-3">
              {level.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {level.estimated_duration_hours}h
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {level.modules?.length || 0} Modules
              </span>
            </div>

            {/* Progress Bar */}
            {levelProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Progress: {Math.round(progressPercentage)}%</span>
                  <span>{levelProgress.videos_completed} videos • {levelProgress.quizzes_completed} quizzes</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-slate-400">
            {isCompleted ? 'Review Level' : isInProgress ? 'Continue Learning' : 'Start Level'}
          </div>
          <Link href={`/curriculum/defender/${level.slug}`}>
            <Button
              size="sm"
              className={`bg-transparent border ${config.borderColor} ${config.textColor} hover:bg-white/10 text-xs px-4 py-2 h-8`}
              disabled={isLocked}
            >
              {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function DefenderTrackPage() {
  const { data: levels, loading, error } = useDefenderCurriculum();
  const { user } = useAuth();
  const { progress } = useDefenderProgress(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading Defender Track...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load Defender track</div>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalProgress = progress.length > 0
    ? Math.round(progress.reduce((acc, p) => acc + p.percent_complete, 0) / progress.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-slate-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/curriculum" className="text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Defender Track
                </h1>
                <p className="text-slate-300 text-sm">Master cybersecurity defense from fundamentals to advanced threat hunting</p>
              </div>
            </div>
          </div>

          {/* Track Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">{levels.length}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Levels</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">
                    {levels.reduce((acc, level) => acc + level.estimated_duration_hours, 0)}h
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Total Time</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-green-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{totalProgress}%</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{totalProgress}%</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Complete</div>
                </div>
              </div>
            </Card>
          </div>

        {/* Overall Progress Bar */}
        {progress.length > 0 && (
          <Card className="p-6 bg-slate-900/50 border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Track Progress</h3>
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {totalProgress}% Complete
              </Badge>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 via-green-400 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </Card>
        )}

        {/* Community Section */}
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Community Support</h3>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Connect with fellow Defender students, get help with missions, and share your learning journey.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/community/spaces/defender-beginner">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-blue-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-medium">Defender Beginner Space</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Join discussions with fellow beginners learning cybersecurity defense.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>1,250 members</span>
                  <span>4 channels</span>
                </div>
              </Card>
            </Link>

            <Link href="/community/spaces/announcements">
              <Card className="p-4 bg-slate-800/50 border-slate-600 hover:border-blue-400 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-medium">Official Announcements</h4>
                </div>
                <p className="text-slate-400 text-sm mb-3">
                  Stay updated with OCH news, updates, and important information.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>5,000 members</span>
                  <span>Global</span>
                </div>
              </Card>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Need help with a specific topic?</span>
              <Link href="/community">
                <Button variant="outline" size="sm" className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white">
                  Explore All Communities
                </Button>
              </Link>
            </div>
          </div>
        </Card>
        </div>
      </div>

      {/* AI Coach Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AiCoachStrip trackSlug="defender" />
      </div>

      {/* Levels Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Learning Levels</h2>
          <p className="text-slate-400 text-sm">Progress through each level to master defensive cybersecurity skills</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {levels.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              progress={progress}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 max-w-2xl mx-auto">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Ready to Become a Cybersecurity Defender?</h3>
            <p className="text-slate-300 text-sm mb-4">
              Master the skills needed to protect organizations from cyber threats. Start with the fundamentals and work your way up to advanced threat hunting techniques.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Hands-on Missions
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Real-world Scenarios
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Career-ready Skills
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
