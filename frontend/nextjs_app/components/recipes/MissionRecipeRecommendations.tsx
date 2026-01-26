/**
 * MissionRecipeRecommendations Component
 *
 * Shows AI-powered contextual recipe recommendations for missions.
 * Uses Grok 3 for intelligent recommendations based on mission content.
 */
'use client';

import { useContextualRecipes } from '@/hooks/useContextualRecipes';
import { RecipePill } from '@/components/recipes/RecipePill';
import { Card } from '@/components/ui/Card';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';

interface MissionRecipeRecommendationsProps {
  missionId: string;
  trackCode?: string;
  title?: string;
}

export function MissionRecipeRecommendations({
  missionId,
  trackCode = 'GENERAL',
  title = '🤖 AI Recommendations for this Mission',
}: MissionRecipeRecommendationsProps) {
  const { recommendations, loading, error } = useContextualRecipes('mission', missionId, trackCode);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-indigo-400">Analyzing mission context...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-orange-400" />
          <span className="text-orange-400">Could not load AI recommendations: {error}</span>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-emerald-400">{title}</h3>
        </div>

        <p className="text-sm text-slate-400">
          Based on this mission's requirements, here are AI-recommended recipes to help you succeed:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.slice(0, 4).map((recipe) => (
            <RecipePill key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </Card>
  );
}

