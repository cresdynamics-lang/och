/**
 * ModuleRecipesSection Component
 *
 * Shows recommended recipes for a curriculum module.
 * Displays as a section within the module view.
 */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, BookOpen, Clock, Target, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeDetailDrawer } from '@/components/recipes/RecipeDetailDrawer';
import type { RecipeListResponse } from '@/services/types/recipes';

interface ModuleRecipesSectionProps {
  moduleId: string;
  skillCodes: string[];
  level: string;
  trackCode: string;
  className?: string;
}

export function ModuleRecipesSection({
  moduleId,
  skillCodes,
  level,
  trackCode,
  className = ''
}: ModuleRecipesSectionProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeListResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Build query params for recipes related to this module
  const queryParams = {
    track_code: trackCode,
    level: level,
    skill_code: skillCodes.length > 0 ? skillCodes[0] : undefined, // Primary skill
  };

  const { recipes, loading, error } = useRecipes(queryParams, { autoFetch: false });

  // Filter recipes to only show those relevant to module skills
  const relevantRecipes = recipes.filter(recipe =>
    skillCodes.some(skill =>
      recipe.skill_code?.toLowerCase().includes(skill.toLowerCase()) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(skill.toLowerCase()))
    )
  ).slice(0, 6); // Limit to 6 for module view

  const handleRecipeClick = (recipe: RecipeListResponse) => {
    setSelectedRecipe(recipe);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedRecipe(null);
  };

  if (relevantRecipes.length === 0 && !loading) {
    return null; // Don't show if no relevant recipes
  }

  return (
    <>
      <section className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Recommended Recipes</h3>
              <p className="text-sm text-slate-400">
                Practice these recipes to reinforce the skills from this module
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/dashboard/student/coaching/recipes', '_blank')}
            className="text-emerald-400 hover:text-emerald-300"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 border-slate-700/50 bg-slate-800/30">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 border-red-500/20 bg-red-500/5">
            <div className="text-center">
              <p className="text-red-400 mb-2">Failed to load recipes</p>
              <Button variant="ghost" size="sm" className="text-red-400">
                Try Again
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relevantRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="group cursor-pointer border-slate-700/50 bg-slate-800/30 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all duration-300"
                  onClick={() => handleRecipeClick(recipe)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                          Recipe
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          recipe.difficulty === 'beginner'
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : recipe.difficulty === 'intermediate'
                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                            : 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                        }`}
                      >
                        {recipe.difficulty}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-slate-200 mb-2 group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {recipe.title}
                    </h4>

                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {recipe.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{recipe.expected_duration_minutes}min</span>
                        </div>
                        {recipe.usage_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{recipe.usage_count} used</span>
                          </div>
                        )}
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    {recipe.status && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <Badge
                          variant="outline"
                          className={`text-xs w-full justify-center ${
                            recipe.status === 'completed'
                              ? 'bg-green-500/20 border-green-500/30 text-green-300'
                              : recipe.status === 'in_progress'
                              ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                              : 'bg-gray-500/20 border-gray-500/30 text-gray-300'
                          }`}
                        >
                          {recipe.status === 'completed' ? '✓ Completed' :
                           recipe.status === 'in_progress' ? '⏳ In Progress' :
                           'Not Started'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recipe Detail Drawer */}
      <RecipeDetailDrawer
        recipe={selectedRecipe}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
}
