/**
 * RecipeDetailDrawer Component
 *
 * Full-featured recipe detail view in a drawer/modal with steps, progress tracking, and validation.
 */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Target,
  CheckCircle,
  Circle,
  Play,
  Star,
  Bookmark,
  BookOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateRecipeProgress } from '@/hooks/useRecipes';
import type { Recipe } from '@/services/types/recipes';

interface RecipeDetailDrawerProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmark?: (recipeId: string) => void;
  isBookmarked?: boolean;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'intermediate':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'advanced':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function RecipeDetailDrawer({
  recipe,
  isOpen,
  onClose,
  onBookmark,
  isBookmarked
}: RecipeDetailDrawerProps) {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showValidation, setShowValidation] = useState(false);

  const {
    updateProgress,
    loading: progressLoading
  } = useUpdateRecipeProgress();

  // Reset completed steps when recipe changes
  useEffect(() => {
    if (recipe) {
      setCompletedSteps(new Set());
      setShowValidation(false);
    }
  }, [recipe]);

  // Load existing progress
  useEffect(() => {
    if (progress?.status === 'completed') {
      // Mark all steps as completed
      setCompletedSteps(new Set(recipe?.steps?.map((_, i) => i) || []));
    }
  }, [progress, recipe]);

  const handleStepToggle = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const handleMarkComplete = async () => {
    if (!recipe || !user) return;

    try {
      await updateProgress(user.id, recipe.id, 'completed');
      setCompletedSteps(new Set(recipe.steps?.map((_, i) => i) || []));
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleStartRecipe = async () => {
    if (!recipe || !user) return;

    try {
      await updateProgress(user.id, recipe.id, 'in_progress');
    } catch (error) {
      console.error('Failed to start recipe:', error);
    }
  };

  const allStepsCompleted = recipe?.steps?.length === completedSteps.size;

  if (!recipe) return null;

  const colors = getDifficultyColor(recipe.difficulty);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: window.innerWidth < 1024 ? '100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: window.innerWidth < 1024 ? '100%' : '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed lg:right-0 lg:top-0 lg:h-full lg:w-full lg:max-w-4xl lg:border-l lg:border-slate-700
                       right-0 top-0 h-full w-full max-w-4xl bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto
                       lg:translate-x-0"
          >
            <div className="min-h-full flex flex-col">
              {/* Header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 p-6 z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
                      {progress?.status && (
                        <Badge variant="outline" className={getStatusColor(progress.status)}>
                          {progress.status === 'in_progress' ? 'In Progress' :
                           progress.status === 'completed' ? 'Completed' : 'Not Started'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className={`flex items-center gap-1 ${colors.text}`}>
                        <Target className="w-4 h-4" />
                        <span className="capitalize">{recipe.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{recipe.expected_duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current text-amber-400" />
                        <span>{recipe.avg_rating || 'New'}</span>
                        <span className="text-slate-600">({recipe.usage_count})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onBookmark && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBookmark(recipe.id)}
                        className={isBookmarked ? "text-indigo-400" : "text-slate-400"}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Track/Skill Badges */}
                <div className="flex flex-wrap gap-2">
                  {recipe.track_code && (
                    <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                      {recipe.track_code}
                    </Badge>
                  )}
                  {recipe.skill_code && (
                    <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                      {recipe.skill_code}
                    </Badge>
                  )}
                  {recipe.tags?.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-slate-500/20 border-slate-500/30 text-slate-300">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  {progress?.status === 'completed' ? (
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </Button>
                  ) : progress?.status === 'in_progress' ? (
                    <>
                      <Button
                        onClick={handleMarkComplete}
                        disabled={progressLoading || !allStepsCompleted}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                      {!allStepsCompleted && (
                        <p className="text-sm text-slate-400 self-center">
                          Complete all steps to mark as done
                        </p>
                      )}
                    </>
                  ) : (
                    <Button onClick={handleStartRecipe} disabled={progressLoading}>
                      <Play className="w-4 h-4 mr-2" />
                      Start Recipe
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-8">
                {/* Description */}
                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                  <p className="text-slate-300 leading-relaxed">{recipe.description}</p>
                </section>

                {/* Prerequisites */}
                {recipe.prerequisites && recipe.prerequisites.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-white mb-3">Prerequisites</h2>
                    <ul className="space-y-2">
                      {recipe.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-300">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Tools & Environment */}
                {recipe.tools_and_environment && recipe.tools_and_environment.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-white mb-3">Tools & Environment</h2>
                    <div className="flex flex-wrap gap-2">
                      {recipe.tools_and_environment.map((tool, index) => (
                        <Badge key={index} variant="outline" className="bg-slate-800 border-slate-600 text-slate-300">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Inputs */}
                {recipe.inputs && recipe.inputs.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-white mb-3">What You'll Need</h2>
                    <ul className="space-y-2">
                      {recipe.inputs.map((input, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-300">
                          <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{input}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Steps */}
                {recipe.steps && recipe.steps.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-semibold text-white">Steps</h2>
                      <span className="text-sm text-slate-400">
                        {completedSteps.size} of {recipe.steps.length} completed
                      </span>
                    </div>

                    <div className="space-y-4">
                      {recipe.steps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`border rounded-lg p-4 transition-all cursor-pointer ${
                            completedSteps.has(index)
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                          onClick={() => handleStepToggle(index)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {completedSteps.has(index) ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-500" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-slate-400">
                                  Step {step.step_number}
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-500" />
                              </div>

                              <h3 className={`font-medium mb-2 ${
                                completedSteps.has(index) ? 'text-green-300' : 'text-white'
                              }`}>
                                {step.instruction}
                              </h3>

                              {step.expected_outcome && (
                                <p className="text-slate-300 text-sm mb-2">
                                  <strong className="text-slate-400">Expected outcome:</strong> {step.expected_outcome}
                                </p>
                              )}

                              {step.evidence_hint && (
                                <p className="text-slate-400 text-sm">
                                  <strong className="text-slate-500">Evidence:</strong> {step.evidence_hint}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Validation Checks */}
                {recipe.validation_checks && recipe.validation_checks.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-semibold text-white">Validation</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowValidation(!showValidation)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {showValidation ? 'Hide' : 'Show'} Checks
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showValidation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          {recipe.validation_checks.map((check, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-slate-300 text-sm">{check}</p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
