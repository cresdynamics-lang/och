import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Clock, Star } from 'lucide-react';
import clsx from 'clsx';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  summary: string;
  difficulty: string;
  estimated_minutes: number;
  avg_rating?: string | number;
  usage_count?: number;
  track_codes?: string[];
}

interface RecipePillProps {
  recipe: Recipe;
  compact?: boolean;
}

function formatRating(rating: string | number | null | undefined): string {
  if (!rating) return 'New';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(numRating) ? 'New' : numRating.toFixed(1);
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'text-emerald-400 bg-emerald-500/20';
    case 'intermediate':
      return 'text-amber-400 bg-amber-500/20';
    case 'advanced':
      return 'text-orange-400 bg-orange-500/20';
    default:
      return 'text-slate-400 bg-slate-500/20';
  }
}

export function RecipePill({ recipe, compact = false }: RecipePillProps) {
  return (
    <Link href={`/dashboard/student/coaching/recipes/${recipe.slug || recipe.id}`}>
      <div className={clsx(
        "group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-all duration-200 hover:bg-slate-800/80 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-900/20",
        compact ? "p-3" : "p-4"
      )}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h4 className={clsx(
              "font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2",
              compact ? "text-sm" : "text-base"
            )}>
              {recipe.title}
            </h4>

            {recipe.track_codes && recipe.track_codes.length > 0 && (
              <Badge
                variant="outline"
                className="ml-2 text-xs bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shrink-0"
              >
                {recipe.track_codes[0]}
              </Badge>
            )}
          </div>

          {/* Summary */}
          {!compact && recipe.summary && (
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
              {recipe.summary}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Difficulty */}
              <Badge
                variant="steel"
                className={clsx(
                  "text-xs font-medium capitalize",
                  getDifficultyColor(recipe.difficulty)
                )}
              >
                {recipe.difficulty}
              </Badge>

              {/* Time */}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{recipe.estimated_minutes}m</span>
              </div>
            </div>

            {/* Rating */}
            {(recipe.avg_rating || recipe.usage_count) && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span>{formatRating(recipe.avg_rating)}</span>
                {recipe.usage_count && (
                  <span className="text-slate-500">({recipe.usage_count})</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
