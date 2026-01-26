/**
 * RecipeDetailShell Component
 * 
 * Main shell for recipe detail page.
 */
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { RecipeContentRenderer } from './RecipeContentRenderer';
import { RecipeActions } from './RecipeActions';
import { RelatedRecipes } from './RelatedRecipes';
import { Badge } from '@/components/ui/Badge';
import { Clock, Star, Target, ArrowLeft, CheckCircle2, BookOpen, ExternalLink, Play, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import type { RecipeDetailResponse } from '@/services/recipesClient';
import { recipesClient } from '@/services/recipesClient';
import type { RecipeContextLink } from '@/services/types/recipes';

interface RecipeDetailShellProps {
  recipe: RecipeDetailResponse;
}

function formatRating(rating: string | number | null | undefined): string {
  if (!rating) return 'New';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(numRating) ? 'New' : numRating.toFixed(1);
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'text-emerald-400';
    case 'intermediate':
      return 'text-amber-400';
    case 'advanced':
      return 'text-orange-400';
    default:
      return 'text-slate-400';
  }
}

export function RecipeDetailShell({ recipe }: RecipeDetailShellProps) {
  const [contextLinks, setContextLinks] = useState<RecipeContextLink[]>([]);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'in_progress':
        return <Play className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'in_progress':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  useEffect(() => {
    async function fetchContextLinks() {
      try {
        const links = await recipesClient.getContextLinks(undefined, undefined);
        // Filter to only show links for this recipe
        const recipeLinks = links.filter((link) => link.recipe === recipe.id);
        setContextLinks(recipeLinks);
      } catch (error) {
        console.error('Error fetching context links:', error);
      }
    }
    fetchContextLinks();
  }, [recipe.id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      // Show mobile actions when scrolled past 50% of page
      setShowMobileActions(scrollPosition > documentHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 pb-24 lg:pb-12">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-indigo-900/50">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <Link href="/dashboard/student/coaching/recipes">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-4 h-4 rounded-full ${getDifficultyColor(recipe.difficulty)} bg-current`} />
                <div className="flex items-center gap-2">
                  {(recipe.track_codes || [recipe.track_code]).filter(Boolean).map((track: string) => (
                    <Badge key={track} variant="outline" className="bg-indigo-500/20 border-indigo-500/30">
                      {track}
                    </Badge>
                  ))}
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-slate-100 leading-tight mb-6">
                {recipe.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-lg text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span>{recipe.expected_duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <span>{formatRating(recipe.avg_rating)}</span>
                </div>
                <div>{recipe.tools_used?.join(', ') || 'CLI'}</div>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <Button
                size="lg"
                className="w-full lg:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
              >
                Start now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS STATUS */}
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card className={`border ${getStatusColor(recipe.user_progress?.status)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(recipe.user_progress?.status)}
                  <div>
                    <h3 className="font-semibold text-slate-200">
                      Recipe Status: {getStatusText(recipe.user_progress?.status)}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {recipe.user_progress?.status === 'completed'
                        ? 'Great work! You\'ve completed this recipe.'
                        : recipe.user_progress?.status === 'in_progress'
                        ? 'You\'re actively working on this recipe.'
                        : 'Ready to start? Click "Start Recipe" to begin learning.'
                      }
                    </p>
                  </div>
                </div>
                {recipe.user_progress?.status === 'completed' && (
                  <Badge variant="mint" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 pb-24 max-w-4xl">
        {/* CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12"
        >
          <div className="lg:col-span-2 space-y-8">
            {/* What this recipe helps you do */}
            {recipe.description && (
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <h2 className="text-2xl font-bold text-slate-200 mb-4">What this recipe helps you do</h2>
                <p className="text-slate-300 leading-relaxed">{recipe.description}</p>
              </Card>
            )}

            {/* Prerequisites */}
            {recipe.prerequisites && recipe.prerequisites.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-slate-200">Prerequisites</h2>
                </div>
                <ul className="space-y-2">
                  {recipe.prerequisites.map((prereq, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Tools and Environment */}
            {recipe.tools_and_environment && recipe.tools_and_environment.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-2xl font-bold text-slate-200">Tools & Environment</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recipe.tools_and_environment.map((tool, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Required Inputs */}
            {recipe.inputs && recipe.inputs.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-5 h-5 text-amber-400" />
                  <h2 className="text-2xl font-bold text-slate-200">Required Inputs</h2>
                </div>
                <ul className="space-y-2">
                  {recipe.inputs.map((input, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <Info className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                      <span>{input}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Step-by-step instructions */}
            <RecipeContentRenderer content={{
              sections: [
                {
                  type: 'steps',
                  title: 'Step-by-Step Instructions',
                  steps: (recipe.steps || []).map(step => ({
                    step: step.step_number,
                    title: step.instruction,
                    explanation: step.expected_outcome,
                    code: step.evidence_hint ? `💡 Evidence Hint: ${step.evidence_hint}` : undefined
                  }))
                }
              ]
            }} />

            {/* Validation section */}
            {recipe.validation_checks && recipe.validation_checks.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h2 className="text-2xl font-bold text-slate-200">How to know you're done</h2>
                </div>
                <div className="space-y-3">
                  {recipe.validation_checks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-slate-300">{check}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Where this is used */}
            {contextLinks.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-2xl font-bold text-slate-200">Where this is used</h2>
                </div>
                <div className="space-y-3">
                  {contextLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/30">
                          {link.context_type === 'mission' && '🎯 Mission'}
                          {link.context_type === 'module' && '📚 Module'}
                          {link.context_type === 'project' && '🚀 Project'}
                          {link.context_type === 'mentor_session' && '👨‍🏫 Mentorship'}
                        </Badge>
                        {link.is_required && (
                          <Badge variant="outline" className="bg-orange-500/20 border-orange-500/30 text-orange-400">
                            Required
                          </Badge>
                        )}
                      </div>
                      <Link href={`/dashboard/student/${link.context_type}s/${link.context_id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            <div className="sticky top-32">
              <RecipeActions recipe={recipe} />
              <div className="mt-8">
                <RelatedRecipes recipeId={recipe.id} recipeSlug={recipe.slug} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Sticky Bottom Bar */}
        <div
          className={`lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 p-4 z-50 transition-transform duration-300 ${
            showMobileActions ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="container mx-auto max-w-4xl flex items-center gap-3">
            <RecipeActions recipe={recipe} compact />
            {contextLinks.length > 0 && (
              <Link href={`/dashboard/student/${contextLinks[0].context_type}s/${contextLinks[0].context_id}`}>
                <Button variant="outline" size="sm" className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open related {contextLinks[0].context_type}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


