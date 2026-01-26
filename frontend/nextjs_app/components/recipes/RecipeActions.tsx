/**
 * RecipeActions Component
 * 
 * Action buttons for bookmarking, completing, and rating recipes.
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Bookmark, CheckCircle2, Star } from 'lucide-react';
import { useRecipeProgress } from '@/hooks/useRecipes';
import type { Recipe } from '@/services/types/recipes';

interface RecipeActionsProps {
  recipe: Recipe;
  compact?: boolean;
}

export function RecipeActions({ recipe, compact = false }: RecipeActionsProps) {
  const { progress, markComplete, updateRating, bookmark, unbookmark, isBookmarked } = useRecipeProgress(recipe.slug);
  const [rating, setRating] = useState(progress?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleComplete = async () => {
    try {
      await markComplete(rating > 0 ? rating : undefined);
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  };

  const handleRating = async (value: number) => {
    setRating(value);
    try {
      await updateRating(value);
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await unbookmark();
      } else {
        await bookmark();
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <Button
          onClick={handleComplete}
          disabled={progress?.status === 'completed'}
          className="w-full"
          variant={progress?.status === 'completed' ? 'mint' : 'defender'}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {progress?.status === 'completed' ? '✓ Completed' : 'Mark Complete'}
        </Button>
        <Button
          onClick={handleBookmark}
          variant={isBookmarked ? 'mint' : 'outline'}
          className="w-full"
        >
          <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Rate this recipe</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    value <= (hoveredRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-500'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleComplete}
            disabled={progress?.status === 'completed'}
            className="w-full"
            variant={progress?.status === 'completed' ? 'mint' : 'defender'}
            size="lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {progress?.status === 'completed' ? '✓ Recipe Completed' : 'Mark Recipe as Complete'}
          </Button>
          <Button
            onClick={handleBookmark}
            variant={isBookmarked ? 'mint' : 'outline'}
            className="w-full"
            size="lg"
          >
            <Bookmark className={`w-5 h-5 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

