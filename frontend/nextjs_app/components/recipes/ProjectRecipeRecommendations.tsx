/**
 * ProjectRecipeRecommendations Component
 * 
 * Shows key recipes for a project template.
 * Used in Projects module.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Clock, Target, FolderOpen } from 'lucide-react';
import { recipesClient } from '@/services/recipesClient';
import type { RecipeContextLink } from '@/services/types/recipes';
import clsx from 'clsx';

interface ProjectRecipeRecommendationsProps {
  projectId: string;
  title?: string;
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

export function ProjectRecipeRecommendations({
  projectId,
  title,
}: ProjectRecipeRecommendationsProps) {
  const [recipes, setRecipes] = useState<RecipeContextLink[]>([]);
  const [loading, setLoading] = useState(true);
  const heading = title ?? "Key recipes you'll use";

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const links = await recipesClient.getContextLinks('project', projectId);
        setRecipes(links);
      } catch (error) {
        console.error('Error fetching project recipe recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchRecipes();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="py-4">
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-40 bg-slate-800/50 rounded-lg animate-pulse"
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
    <div className="py-4">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="w-5 h-5 text-indigo-400" />
        <h3 className="text-base font-semibold text-slate-200">{heading}</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {recipes.map((link) => (
          <motion.div
            key={link.id}
            whileHover={{ scale: 1.05 }}
            className="group"
          >
            <Link href={`/recipes/${link.recipe_slug}`}>
              <div className="bg-gradient-to-br from-slate-900/70 via-indigo-900/20 to-purple-900/20 border border-slate-800/50 rounded-lg px-4 py-3 hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 cursor-pointer min-w-[200px]">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-200 line-clamp-1">
                    {link.recipe_title}
                  </h4>

                  <div className="flex items-center gap-2 text-xs">
                    <div className={clsx('flex items-center gap-1 px-2 py-0.5 rounded', getDifficultyColor(link.recipe_difficulty))}>
                      <Target className="w-3 h-3" />
                      <span className="capitalize">{link.recipe_difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{link.recipe_estimated_minutes}min</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

