/**
 * RecipePill Component
 * 
 * Compact recipe recommendation card for quick-start micro-skills.
 */
'use client';

import { motion } from 'framer-motion';
import { Clock, Play, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { RecipeRecommendation } from '@/services/types/curriculum';
import Link from 'next/link';

interface RecipePillProps {
  recipe: RecipeRecommendation;
  className?: string;
}

const difficultyColors: Record<string, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  intermediate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  advanced: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
};

export function RecipePill({ recipe, className = '' }: RecipePillProps) {
  const colors = difficultyColors[recipe.recipe_difficulty || 'beginner'] || difficultyColors.beginner;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Link href={`/recipes/${recipe.recipe_id}`} target="_blank">
        <div className={`
          h-auto py-3 lg:py-4 px-4 lg:px-5 flex-shrink-0 
          border-2 ${colors.border} bg-gradient-to-r from-cyan-500/10 to-blue-500/10 
          hover:border-cyan-500/50 hover:bg-cyan-500/20 
          shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 
          rounded-xl lg:rounded-2xl group transition-all duration-300 
          w-44 lg:w-52 xl:w-56 cursor-pointer
        `}>
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <Badge 
              variant="outline" 
              className={`text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 h-auto ${colors.bg} ${colors.border} ${colors.text}`}
            >
              {recipe.recipe_difficulty || 'beginner'}
            </Badge>
            
            {recipe.recipe_duration_minutes && (
              <div className="flex items-center gap-1 text-[10px] lg:text-xs text-cyan-400 font-mono bg-cyan-500/20 px-1.5 lg:px-2 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                {recipe.recipe_duration_minutes}m
              </div>
            )}
          </div>
          
          {/* Title */}
          <h5 className="font-semibold text-slate-200 text-xs lg:text-sm leading-tight line-clamp-2 mb-2 group-hover:text-cyan-300 transition-colors">
            {recipe.recipe_title || 'Quick Recipe'}
          </h5>
          
          {/* Action hint */}
          <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
            <Play className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
            Quick Start
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * RecipePillCarousel Component
 * 
 * Horizontal scrolling carousel of recipe recommendations.
 */
interface RecipePillCarouselProps {
  recipes: RecipeRecommendation[];
  title?: string;
}

export function RecipePillCarousel({ recipes, title }: RecipePillCarouselProps) {
  if (!recipes || recipes.length === 0) return null;

  return (
    <div className="space-y-3 lg:space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm lg:text-base font-bold text-slate-300">{title}</h4>
        </div>
      )}
      
      <div className="flex overflow-x-auto gap-3 lg:gap-4 pb-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {recipes.map((recipe) => (
          <RecipePill key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

