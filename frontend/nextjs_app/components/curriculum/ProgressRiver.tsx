/**
 * ProgressRiver Component
 * 
 * Visual learning path with animated module cards, mission integration,
 * and entitlement-aware locking.
 */
'use client';

import { motion } from 'framer-motion';
import { 
  Lock, CheckCircle2, Play, Target, ChevronRight,
  Clock, Zap, BookOpen, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CircularProgress } from './CircularProgress';
import { RecipePill } from './RecipePill';
import { RecipeRecommendationsStrip } from '@/components/recipes/RecipeRecommendationsStrip';
import type {
  CurriculumModuleList,
  SubscriptionTier,
  ModuleLevel,
} from '@/services/types/curriculum';
import Link from 'next/link';

interface ProgressRiverProps {
  modules: (CurriculumModuleList & { isLocked: boolean; isCurrent: boolean })[];
  subscriptionTier: SubscriptionTier;
  onModuleSelect: (moduleId: string) => void;
  activeModuleId: string | null;
  trackCode: string;
}

const levelColors: Record<ModuleLevel, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'from-emerald-500/20 to-teal-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  intermediate: { bg: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  advanced: { bg: 'from-orange-500/20 to-red-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  capstone: { bg: 'from-purple-500/20 to-pink-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
};

export function ProgressRiver({
  modules,
  subscriptionTier,
  onModuleSelect,
  activeModuleId,
  trackCode,
}: ProgressRiverProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 lg:gap-4">
        <div className="w-px h-6 lg:h-8 bg-gradient-to-b from-emerald-400 to-transparent" />
        <h2 className="text-xl lg:text-2xl xl:text-3xl font-black text-slate-200">Your Learning Path</h2>
      </div>

      {/* Modules */}
      <div className="space-y-4 lg:space-y-6">
        {modules.map((module, index) => {
          const isCompleted = module.completion_percentage === 100;
          const isActive = module.id === activeModuleId;
          const levelStyle = levelColors[module.level] || levelColors.beginner;
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connection Line */}
              {index < modules.length - 1 && (
                <div className="absolute left-6 lg:left-10 top-full w-0.5 h-4 lg:h-6 bg-gradient-to-b from-indigo-500/50 to-transparent z-0" />
              )}

              <div
                onClick={() => !module.isLocked && onModuleSelect(module.id)}
                className={`
                  group relative overflow-hidden rounded-2xl lg:rounded-3xl border-2 lg:border-4 
                  transition-all duration-500 cursor-pointer
                  ${isActive 
                    ? 'border-emerald-500/70 bg-emerald-500/10 shadow-2xl shadow-emerald-500/30 ring-2 lg:ring-4 ring-emerald-500/30' 
                    : isCompleted 
                      ? 'border-emerald-400/50 bg-emerald-500/5 shadow-xl shadow-emerald-400/20 border-r-4 lg:border-r-8 border-r-emerald-400' 
                      : module.isLocked
                        ? 'border-slate-700/50 bg-slate-900/30 shadow-lg shadow-slate-900/30 cursor-not-allowed' 
                        : 'border-indigo-500/30 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:scale-[1.01]'
                  }
                `}
              >
                <div className="p-5 lg:p-8 xl:p-10 relative z-10">
                  {/* MODULE HEADER */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6 mb-4 lg:mb-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 lg:gap-4 mb-2 lg:mb-3">
                        {/* Status Icon */}
                        <div className={`
                          w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0
                          ${isCompleted ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' :
                            module.isLocked ? 'bg-slate-600' : 'bg-indigo-500 shadow-lg shadow-indigo-500/50'}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                          ) : module.isLocked ? (
                            <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
                          ) : module.isCurrent ? (
                            <Play className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                          ) : (
                            <Target className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                          )}
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black text-slate-100 leading-tight truncate">
                          {module.title}
                        </h3>
                      </div>

                      {/* Badges and Stats */}
                      <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm">
                        {/* Progress */}
                        <div className="flex items-center gap-1.5 lg:gap-2 text-emerald-400 font-mono font-bold">
                          <span className="text-base lg:text-xl">{Math.round(module.completion_percentage)}%</span>
                        </div>
                        
                        {/* Lesson count */}
                        <div className="flex items-center gap-1 text-slate-400">
                          <BookOpen className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span>{module.lesson_count} lessons</span>
                        </div>
                        
                        {/* Level badge */}
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] lg:text-xs uppercase ${levelStyle.text} ${levelStyle.border} bg-gradient-to-r ${levelStyle.bg}`}
                        >
                          {module.level}
                        </Badge>
                        
                        {/* Mission indicator */}
                        {module.mission_count > 0 && (
                          <Badge 
                            variant="outline" 
                            className="text-[10px] lg:text-xs uppercase text-orange-400 border-orange-500/30 bg-orange-500/10"
                          >
                            <Zap className="w-2.5 h-2.5 lg:w-3 lg:h-3 mr-1" />
                            {module.mission_count} Mission{module.mission_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                        
                        {/* Time estimate */}
                        {module.estimated_time_minutes && (
                          <div className="hidden sm:flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{Math.round(module.estimated_time_minutes / 60)}h</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PROGRESS CIRCLE */}
                    <div className="hidden lg:block flex-shrink-0">
                      <div className="w-20 h-20 xl:w-24 xl:h-24 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-2 flex items-center justify-center relative">
                        <CircularProgress 
                          percentage={module.completion_percentage} 
                          size={60}
                          strokeWidth={4}
                          className={module.isLocked ? 'text-slate-600' : 'text-emerald-400'}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg xl:text-xl font-mono font-bold text-slate-100">
                            {Math.round(module.completion_percentage)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MODULE DESCRIPTION */}
                  {module.description && !module.isLocked && (
                    <p className="text-slate-400 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6 line-clamp-2">
                      {module.description}
                    </p>
                  )}

                  {/* RECIPE RECOMMENDATIONS */}
                  {!module.isLocked && (
                    <div className="mb-4">
                      <RecipeRecommendationsStrip moduleId={module.id} maxRecipes={3} />
                    </div>
                  )}

                  {/* ACTION BUTTON (for active/incomplete modules) */}
                  {!module.isLocked && !isCompleted && (
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                      <Link href={`/dashboard/student/curriculum/${trackCode}/module/${module.id}`}>
                        <Button 
                          size="lg"
                          className={`
                            w-full sm:w-auto min-w-[160px] lg:min-w-[180px] h-11 lg:h-14 font-bold text-sm lg:text-lg
                            ${module.isCurrent 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/50' 
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40'}
                          `}
                        >
                          {module.completion_percentage > 0 ? (
                            <>
                              <Play className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                              Continue
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                              Start Module
                            </>
                          )}
                        </Button>
                      </Link>
                      
                      {/* View Details */}
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full sm:w-auto h-11 lg:h-14 border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          onModuleSelect(module.id);
                        }}
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* COMPLETED STATE */}
                  {isCompleted && (
                    <div className="flex items-center gap-3 p-3 lg:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl lg:rounded-2xl">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-bold text-emerald-400 text-sm lg:text-base">Module Completed!</div>
                        <div className="text-xs lg:text-sm text-slate-400">All lessons and missions finished</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LOCKED OVERLAY */}
                {module.isLocked && (
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 lg:p-8">
                    <div className="text-center max-w-sm mx-auto">
                      <div className="w-14 h-14 lg:w-16 lg:h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6">
                        <Lock className="w-6 h-6 lg:w-8 lg:h-8 text-slate-500" />
                      </div>
                      <h4 className="text-base lg:text-xl font-bold text-slate-300 mb-2 lg:mb-3">
                        {module.entitlement_tier === 'professional' ? 'Professional Tier Required' : 'Enhanced Access Required'}
                      </h4>
                      <p className="text-slate-500 text-xs lg:text-sm mb-4 lg:mb-6 leading-relaxed">
                        Unlock advanced modules, mentor reviews, and capstone missions
                      </p>
                      <div className="flex flex-col gap-2 lg:gap-3">
                        <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/30 h-10 lg:h-12">
                          Upgrade ($7/mo)
                        </Button>
                        <Button variant="ghost" className="w-full text-slate-400 hover:text-white h-9 lg:h-10">
                          Preview Content
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

