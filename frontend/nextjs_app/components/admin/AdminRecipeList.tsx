/**
 * AdminRecipeList Component
 *
 * Administrative table view for managing recipes with advanced filtering.
 */
'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Star,
  Users,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeFilters } from '@/hooks/useRecipeFilters';
import type { RecipeListResponse } from '@/services/types/recipes';

interface AdminRecipeListProps {
  onCreateRecipe?: () => void;
  onEditRecipe?: (recipe: RecipeListResponse) => void;
  onViewRecipe?: (recipe: RecipeListResponse) => void;
  onDeleteRecipe?: (recipeId: string) => void;
}

function Dropdown({
  options,
  value,
  onChange,
  placeholder
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-slate-600/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all min-w-[120px]"
      >
        <span className={value ? 'text-slate-200' : 'text-slate-400'}>
          {value ? options.find(opt => opt.value === value)?.label : placeholder}
        </span>
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 focus:bg-slate-700/50 focus:outline-none"
            >
              <span className="text-slate-200">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TRACK_OPTIONS = [
  { value: '', label: 'All Tracks' },
  { value: 'defender', label: 'Defender' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'grc', label: 'GRC' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'leadership', label: 'Leadership' },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'mastery', label: 'Mastery' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'manual', label: 'Manual' },
  { value: 'llm_generated', label: 'LLM Generated' },
  { value: 'external_doc', label: 'External Doc' },
  { value: 'lab_platform', label: 'Lab Platform' },
  { value: 'community', label: 'Community' },
];

export function AdminRecipeList({
  onCreateRecipe,
  onEditRecipe,
  onViewRecipe,
  onDeleteRecipe
}: AdminRecipeListProps) {
  const { filters, updateFilter, clearFilters, hasActiveFilters, getQueryParams } = useRecipeFilters();
  const { recipes, loading, error, stats } = useRecipes(getQueryParams());

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [sortBy, setSortBy] = useState<'title' | 'usage_count' | 'avg_rating' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort recipes
  const filteredRecipes = recipes
    .filter(recipe => {
      const matchesSearch = !searchTerm ||
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.skill_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTrack = !filters.track || recipe.track_code === filters.track;
      const matchesLevel = !filters.level || recipe.level === filters.level;

      return matchesSearch && matchesTrack && matchesLevel;
    })
    .sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'avg_rating') {
        aVal = parseFloat(a.avg_rating || '0');
        bVal = parseFloat(b.avg_rating || '0');
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200">Recipe Management</h1>
          <p className="text-slate-400 mt-1">
            Manage and monitor recipe library ({stats.total} total recipes)
          </p>
        </div>
        <Button onClick={onCreateRecipe} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Recipe
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 border-slate-700/50 bg-slate-800/30">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateFilter('search', e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Dropdown
              options={TRACK_OPTIONS}
              value={filters.track}
              onChange={(value) => updateFilter('track', value)}
              placeholder="Track"
            />
            <Dropdown
              options={LEVEL_OPTIONS}
              value={filters.level}
              onChange={(value) => updateFilter('level', value)}
              placeholder="Level"
            />
            <Dropdown
              options={SOURCE_OPTIONS}
              value={filters.source || ''}
              onChange={(value) => updateFilter('source', value)}
              placeholder="Source"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-slate-400 hover:text-slate-200">
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-200">{stats.total}</p>
              <p className="text-sm text-slate-400">Total Recipes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-200">
                {recipes.reduce((sum, r) => sum + (parseFloat(r.avg_rating) || 0), 0) / recipes.length || 0}
              </p>
              <p className="text-sm text-slate-400">Avg Rating</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-200">
                {recipes.reduce((sum, r) => sum + r.usage_count, 0)}
              </p>
              <p className="text-sm text-slate-400">Total Usage</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-200">
                {Math.round(recipes.reduce((sum, r) => sum + r.expected_duration_minutes, 0) / recipes.length || 0)}min
              </p>
              <p className="text-sm text-slate-400">Avg Duration</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-slate-700/50 bg-slate-800/30">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700/50">
              <tr>
                <th className="text-left p-4 text-slate-400 font-medium">Recipe</th>
                <th className="text-left p-4 text-slate-400 font-medium">Track</th>
                <th className="text-left p-4 text-slate-400 font-medium">Level</th>
                <th className="text-left p-4 text-slate-400 font-medium">Skill</th>
                <th className="text-left p-4 text-slate-400 font-medium">Source</th>
                <th className="text-left p-4 text-slate-400 font-medium cursor-pointer hover:text-slate-200" onClick={() => handleSort('usage_count')}>
                  Usage {sortBy === 'usage_count' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-left p-4 text-slate-400 font-medium cursor-pointer hover:text-slate-200" onClick={() => handleSort('avg_rating')}>
                  Rating {sortBy === 'avg_rating' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading recipes...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <p className="text-red-400">Failed to load recipes</p>
                  </td>
                </tr>
              ) : filteredRecipes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <p className="text-slate-400">No recipes found</p>
                  </td>
                </tr>
              ) : (
                filteredRecipes.map((recipe) => (
                  <tr key={recipe.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-200">{recipe.title}</p>
                        <p className="text-sm text-slate-400 line-clamp-1">{recipe.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                        {recipe.track_code}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={`${
                        recipe.level === 'beginner' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                        recipe.level === 'intermediate' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
                        recipe.level === 'advanced' ? 'bg-orange-500/20 border-orange-500/30 text-orange-300' :
                        'bg-slate-500/20 border-slate-500/30 text-slate-300'
                      }`}>
                        {recipe.level}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300">{recipe.skill_code}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-slate-500/20 border-slate-500/30 text-slate-300">
                        {recipe.source_type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300">{recipe.usage_count}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-amber-400" />
                        <span className="text-slate-300">{recipe.avg_rating || '0'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewRecipe?.(recipe)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRecipe?.(recipe)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteRecipe?.(recipe.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
