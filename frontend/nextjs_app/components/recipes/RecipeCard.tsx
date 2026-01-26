/**
 * RecipeCard Component
 *
 * Card component for displaying a recipe in the grid with hover actions and status indicators.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Star, Clock, Target, Bookmark, Play, CheckCircle, Circle, Lock } from 'lucide-react';
import { useRecipeEntitlements } from '@/lib/hooks/useRecipeEntitlements';
import type { RecipeListResponse } from '@/services/types/recipes';
import clsx from 'clsx';

interface RecipeCardProps {
  recipe: RecipeListResponse & {
    is_user_track?: boolean;
    track_access?: 'full' | 'preview';
  };
  isBookmarked?: boolean;
  onBookmark?: (recipeId: string) => void;
  onStart?: (recipeId: string) => void;
  onMarkComplete?: (recipeId: string) => void;
  showProgress?: boolean;
  isLocked?: boolean;
}

function formatRating(rating: string | number | null | undefined): string {
  if (!rating) return 'New';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(numRating) ? 'New' : numRating.toFixed(1);
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
    case 'not_started':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getStatusIcon(status?: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-3 h-3" />;
    case 'in_progress':
      return <Play className="w-3 h-3" />;
    default:
      return <Circle className="w-3 h-3" />;
  }
}

export function RecipeCard({
  recipe,
  isBookmarked,
  onBookmark,
  onStart,
  onMarkComplete,
  showProgress = true,
  isLocked = false
}: RecipeCardProps) {
  const router = useRouter();
  const { canAccessRecipe, getEntitlementMessage } = useRecipeEntitlements();
  const hasAccess = canAccessRecipe(recipe);
  const entitlementMessage = getEntitlementMessage(recipe);
  const colors = getDifficultyColor(recipe.difficulty);

  // Check track-based access
  const isUserTrack = recipe.is_user_track ?? true;
  const trackAccess = recipe.track_access ?? 'full';
  const isTrackLocked = !isUserTrack && trackAccess === 'preview';

  return (
    <motion.div whileHover={{ scale: hasAccess ? 1.02 : 1.0 }} className="group h-full">
          <Card
            className={clsx(
              "group relative h-full bg-gradient-to-br from-slate-900/70 via-indigo-900/20 to-purple-900/20 border border-slate-800/50 transition-all duration-500 overflow-hidden flex flex-col cursor-pointer",
              hasAccess ? "hover:border-indigo-500/70 hover:shadow-2xl hover:shadow-indigo-500/25 hover:bg-indigo-500/5" : "opacity-75"
            )}
            onClick={() => hasAccess && router.push(`/dashboard/student/coaching/recipes/${recipe.slug}`)}
          >
            {/* Lock Overlay for Inaccessible Recipes */}
            {!hasAccess && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center p-4">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-amber-300 text-sm font-medium">
                    {isTrackLocked ? 'Different Track' : 'Premium Recipe'}
                  </p>
                  <p className="text-amber-400/80 text-xs mt-1 max-w-xs">{entitlementMessage}</p>
                  {isTrackLocked && (
                    <p className="text-amber-400/60 text-xs mt-2">
                      Switch to {recipe.track_code} track for full access
                    </p>
                  )}
                </div>
              </div>
            )}
          {/* THUMBNAIL */}
          {recipe.thumbnail_url && (
            <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 relative overflow-hidden">
              <img
                src={recipe.thumbnail_url}
                alt={recipe.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400">
                  {recipe.tools_used?.[0] || 'CLI'}
                </Badge>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* TITLE & METADATA */}
            <div className="space-y-3">
              <h3 className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-indigo-300 transition-colors text-slate-200">
                {recipe.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className={clsx('flex items-center gap-1', colors.text)}>
                  <Target className="w-3 h-3" />
                  <span className="capitalize">{recipe.difficulty}</span>
                </div>
                <div className="w-1 h-1 bg-slate-500 rounded-full" />
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{recipe.estimated_minutes}min</span>
                </div>
              </div>

              {/* TRACK BADGES */}
              {recipe.track_codes && recipe.track_codes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.track_codes.slice(0, 2).map((track: string) => (
                    <Badge
                      key={track}
                      variant="outline"
                      className="text-xs bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                    >
                      {track}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CONTEXT LABELS */}
              {recipe.context_labels && recipe.context_labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {recipe.context_labels.map((label: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* STATUS & STATS */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                {/* STATUS BADGE */}
                {showProgress && recipe.status && (
                  <Badge variant="outline" className={clsx('text-xs flex items-center gap-1', getStatusColor(recipe.status))}>
                    {getStatusIcon(recipe.status)}
                    <span className="capitalize">{recipe.status?.replace('_', ' ')}</span>
                  </Badge>
                )}

                {/* FREE SAMPLE BADGE */}
                {recipe.is_free_sample && (
                  <div className="mt-2">
                    <Badge variant="solid" className="bg-emerald-600 text-white text-xs">
                      🔓 Free Sample
                    </Badge>
                  </div>
                )}

                {/* STATS */}
                <div className="flex items-center gap-3 text-xs text-slate-500 ml-auto">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-amber-400" />
                    <span>{formatRating(recipe.avg_rating)}</span>
                    <span className="text-slate-600">({recipe.usage_count})</span>
                  </div>
                  {isBookmarked && (
                    <div className="flex items-center gap-1 text-indigo-400">
                      <Bookmark className="w-3 h-3 fill-current" />
                      <span>Saved</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* FOOTER - Enhanced Actions */}
        <div className="px-6 pb-6 pt-0 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800/50 mt-auto">
          <div className="flex gap-2 mt-4">
            {/* Primary Action */}
              <Button
                size="sm"
                variant={hasAccess ? "defender" : "outline"}
                className="w-full h-10 font-semibold flex-1"
                onClick={() => router.push(`/dashboard/student/coaching/recipes/${recipe.slug}`)}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Upgrade Required
                  </>
                ) : recipe.status === 'completed' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Review
                  </>
                ) : recipe.status === 'in_progress' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Continue
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Recipe
                  </>
                )}
              </Button>

            {/* Secondary Actions - Show on hover */}
            <AnimatePresence>
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Bookmark Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className={clsx(
                    "h-10 w-10 p-0",
                    isBookmarked ? "text-indigo-400" : "text-slate-400 hover:text-indigo-400"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBookmark?.(recipe.id);
                  }}
                >
                  <Bookmark className={clsx("w-4 h-4", isBookmarked && "fill-current")} />
                </Button>

                {/* Quick Complete Button (for in-progress recipes) */}
                {recipe.status === 'in_progress' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 w-10 p-0 text-slate-400 hover:text-green-400"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onMarkComplete?.(recipe.id);
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}


