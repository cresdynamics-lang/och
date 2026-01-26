/**
 * Curriculum Hierarchy Component - Refactored
 * The "GPS" for navigating Tracks, Modules, and Lessons
 */
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronDown, 
  PlayCircle, 
  CheckCircle2, 
  Lock, 
  Video, 
  FileText, 
  Zap, 
  BookOpen
} from 'lucide-react';
import clsx from 'clsx';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  type: 'video' | 'reading' | 'quiz';
}

interface Module {
  id: string;
  title: string;
  description: string;
  tier: number;
  lessons: Lesson[];
  progress: number;
  isLocked: boolean;
  hasMission: boolean;
}

interface CurriculumHierarchyProps {
  currentTier: number;
  modules: Module[];
  onSelectLesson: (lessonId: string) => void;
}

export function CurriculumHierarchy({ currentTier, modules, onSelectLesson }: CurriculumHierarchyProps) {
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const tiers = [1, 2, 3, 4, 5];
  const tierLabels = [
    'Foundations',
    'Beginner',
    'Intermediate',
    'Mastery',
    'Expert'
  ];

  const filteredModules = modules.filter(m => m.tier === selectedTier);

  return (
    <div className="space-y-6">
      {/* Tier Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tiers.map((tier, idx) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={clsx(
              "flex-shrink-0 px-6 py-3 rounded-xl border transition-all duration-300",
              selectedTier === tier
                ? "bg-och-defender border-och-defender text-white shadow-lg shadow-och-defender/20"
                : "bg-och-midnight/50 border-och-steel/20 text-och-steel hover:border-och-defender/50"
            )}
          >
            <div className="text-[10px] uppercase tracking-widest font-bold mb-0.5 opacity-70">
              Tier {tier}
            </div>
            <div className="text-sm font-bold tracking-wider">{tierLabels[idx]}</div>
          </button>
        ))}
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-och-steel/20 bg-transparent">
            <Lock className="w-10 h-10 text-och-steel mx-auto mb-4 opacity-30" />
            <p className="text-och-steel font-medium">This tier is currently locked in your blueprint.</p>
          </Card>
        ) : (
          filteredModules.map((module) => (
            <Card 
              key={module.id} 
              className={clsx(
                "overflow-hidden transition-all duration-300 group",
                module.isLocked ? "opacity-60" : "hover:border-och-defender/40"
              )}
            >
              <div 
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => !module.isLocked && setExpandedModule(expandedModule === module.id ? null : module.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={clsx(
                    "w-12 h-12 rounded-lg flex items-center justify-center border transition-colors",
                    module.isLocked 
                      ? "bg-och-steel/10 border-och-steel/20 text-och-steel" 
                      : "bg-och-defender/10 border-och-defender/30 text-och-defender group-hover:bg-och-defender/20"
                  )}>
                    {module.isLocked ? <Lock className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white tracking-wide">{module.title}</h4>
                      {module.hasMission && (
                        <Badge variant="orange" className="text-[9px] uppercase font-black px-1.5 py-0.5">Mission</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-och-steel">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-3 h-3" /> {module.lessons.length} Lessons
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-och-mint" /> {module.lessons.filter(l => l.isCompleted).length} Completed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden md:block w-32">
                    <ProgressBar value={module.progress} showLabel={false} className="h-1.5" />
                  </div>
                  {expandedModule === module.id ? <ChevronDown className="w-5 h-5 text-och-steel" /> : <ChevronRight className="w-5 h-5 text-och-steel" />}
                </div>
              </div>

              {/* Expanded Lessons */}
              <AnimatePresence>
                {expandedModule === module.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-och-steel/10 bg-och-midnight/30"
                  >
                    <div className="p-4 space-y-2">
                      {module.lessons.map((lesson) => (
                        <div 
                          key={lesson.id}
                          onClick={() => !lesson.isLocked && onSelectLesson(lesson.id)}
                          className={clsx(
                            "flex items-center justify-between p-3 rounded-lg transition-all duration-200",
                            lesson.isLocked 
                              ? "opacity-50 grayscale cursor-not-allowed" 
                              : "hover:bg-och-defender/10 cursor-pointer group/lesson"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {lesson.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-och-mint" />
                            ) : lesson.isLocked ? (
                              <Lock className="w-4 h-4 text-och-steel" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-och-defender group-hover/lesson:scale-110 transition-transform" />
                            )}
                            <span className={clsx(
                              "text-sm font-medium transition-colors",
                              lesson.isCompleted ? "text-och-steel line-through" : "text-slate-200 group-hover/lesson:text-white"
                            )}>
                              {lesson.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-och-steel font-mono">{lesson.duration}</span>
                            {lesson.type === 'video' && <Video className="w-3 h-3 text-och-steel opacity-50" />}
                            {lesson.type === 'reading' && <FileText className="w-3 h-3 text-och-steel opacity-50" />}
                          </div>
                        </div>
                      ))}

                      {/* Mission CTA */}
                      {module.hasMission && module.progress >= 100 && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-och-orange/20 to-transparent border border-och-orange/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-och-orange animate-pulse" />
                              <div>
                                <p className="text-sm font-bold text-white uppercase tracking-wider">Applied Mission Ready</p>
                                <p className="text-xs text-och-steel">Prove your mastery and produce evidence.</p>
                              </div>
                            </div>
                            <button className="px-4 py-1.5 bg-och-orange text-white text-xs font-black uppercase rounded-lg hover:bg-och-orange/80 transition-all">
                              Start Mission
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
