/**
 * RecipeFilters Component
 * 
 * Filter chips for track, difficulty, time, and sort options.
 */
'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { RecipeFilters, RecipeDifficulty, RecipeStats } from '@/services/types/recipes';
import { Clock, Target, Star, TrendingUp } from 'lucide-react';

interface RecipeFiltersProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  stats?: RecipeStats;
}

const TRACK_OPTIONS = [
  { code: '', label: 'All Tracks' },
  { code: 'SOCDEFENSE', label: '🎯 Defense' },
  { code: 'DFIR', label: '🔍 DFIR' },
  { code: 'CLOUD', label: '☁️ Cloud' },
  { code: 'GRC', label: '⚖️ GRC' },
];

const DIFFICULTY_OPTIONS: { value: RecipeDifficulty | ''; label: string; color: string }[] = [
  { value: '', label: 'All Levels', color: 'steel' },
  { value: 'beginner', label: 'Beginner', color: 'mint' },
  { value: 'intermediate', label: 'Intermediate', color: 'gold' },
  { value: 'advanced', label: 'Advanced', color: 'orange' },
];

const TIME_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: '15', label: '⏱️ <15min' },
  { value: '30', label: '⏱️ <30min' },
  { value: '45', label: '⏱️ <45min' },
];

const CONTEXT_OPTIONS = [
  { value: '', label: 'All Contexts' },
  { value: 'module', label: '📚 Curriculum' },
  { value: 'mission', label: '🎯 Missions' },
  { value: 'project', label: '🚀 Projects' },
  { value: 'mentor_session', label: '👨‍🏫 Mentorship' },
];

const SORT_OPTIONS: { value: RecipeFilters['sort']; label: string; icon: any }[] = [
  { value: 'relevance', label: 'Relevance', icon: TrendingUp },
  { value: 'popular', label: 'Popular', icon: Star },
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'rating', label: 'Top Rated', icon: Target },
];

export function RecipeFilters({ filters, onFiltersChange, stats }: RecipeFiltersProps) {
  const handleFilterChange = (key: keyof RecipeFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Track Filter */}
        {TRACK_OPTIONS.map((option) => (
          <Button
            key={option.code}
            variant={filters.track === option.code ? 'defender' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('track', option.code || undefined)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}

        {/* Difficulty Filter */}
        {DIFFICULTY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filters.difficulty === option.value ? 'defender' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('difficulty', option.value || undefined)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}

        {/* Time Filter */}
        {TIME_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filters.max_time?.toString() === option.value ? 'defender' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('max_time', option.value ? parseInt(option.value) : undefined)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}

        {/* Context Filter */}
        {CONTEXT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filters.context === option.value ? 'defender' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange('context', option.value || undefined)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Sort:</span>
        {SORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.value}
              variant={filters.sort === option.value ? 'defender' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('sort', option.value)}
              className="text-xs flex items-center gap-1"
            >
              <Icon className="w-3 h-3" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}


