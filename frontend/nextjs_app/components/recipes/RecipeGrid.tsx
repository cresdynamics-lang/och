/**
 * RecipeGrid Component
 * 
 * Grid layout for displaying recipe cards.
 */
'use client';

import { motion } from 'framer-motion';
import { RecipeCard } from './RecipeCard';
import { Button } from '@/components/ui/Button';
import { Loader2, BookOpen } from 'lucide-react';
import type { RecipeListResponse } from '@/services/types/recipes';

interface RecipeGridProps {
  recipes: RecipeListResponse[];
  bookmarks: string[];
  loading: boolean;
}

export function RecipeGrid({ recipes, bookmarks, loading }: RecipeGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
          <p className="text-slate-400">Loading recipes...</p>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-32">
        <BookOpen className="w-24 h-24 text-slate-700 mx-auto mb-8 opacity-50" />
        <h3 className="text-2xl font-bold text-slate-300 mb-4">No recipes found</h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Try different filters or search terms. Popular recipes include Sigma rules, log parsing, and cloud setup.
        </p>
        <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30">
          Explore Popular
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {recipes.map((recipe, index) => (
        <motion.div
          key={recipe.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <RecipeCard recipe={recipe} isBookmarked={bookmarks.includes(recipe.id)} />
        </motion.div>
      ))}
    </div>
  );
}


