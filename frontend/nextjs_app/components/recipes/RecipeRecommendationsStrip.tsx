/**
 * RecipeRecommendationsStrip Component
 * 
 * Horizontal strip showing recommended recipes for a module.
 * Used in Curriculum module views.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { recipesClient } from '@/services/recipesClient';
import type { RecipeContextLink, RecipeListResponse } from '@/services/types/recipes';
import clsx from 'clsx';

interface RecipeRecommendationsStripProps {
  moduleId: string;
  title?: string;
  maxRecipes?: number;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'intermediate':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'advanced':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export function RecipeRecommendationsStrip({
  moduleId,
  title = '💡 Recommended Recipes for this module',
  maxRecipes = 4,
}: RecipeRecommendationsStripProps) {
  const [recipes, setRecipes] = useState<RecipeContextLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const links = await recipesClient.getContextLinks('module', moduleId);
        setRecipes(links.slice(0, maxRecipes));
      } catch (error) {
        console.error('Error fetching recipe recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (moduleId) {
      fetchRecipes();
    }
  }, [moduleId, maxRecipes]);

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 w-48 bg-slate-800/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="py-6 border-t border-slate-800/50">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {recipes.map((link) => (
          <motion.div
            key={link.id}
            whileHover={{ scale: 1.02 }}
            className="flex-shrink-0"
          >
            <Link href={`/recipes/${link.recipe_slug}`}>
              <div className="w-56 bg-gradient-to-br from-slate-900/70 via-indigo-900/20 to-purple-900/20 border border-slate-800/50 rounded-xl p-4 hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 cursor-pointer">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-slate-200 line-clamp-2 flex-1">
                      {link.recipe_title}
                    </h4>
                    {link.is_required && (
                      <Badge variant="outline" className="text-xs bg-orange-500/20 border-orange-500/30 text-orange-400">
                        Required
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className={clsx('flex items-center gap-1 px-2 py-1 rounded', getDifficultyColor(link.recipe_difficulty))}>
                      <Target className="w-3 h-3" />
                      <span className="capitalize">{link.recipe_difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{link.recipe_estimated_minutes}min</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {link.recipe_summary}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

