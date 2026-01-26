/**
 * MissionRecipesSidebar Component
 *
 * Contextual sidebar showing recipes relevant to a mission.
 * Displays compact recipe cards with quick access to recipe details.
 */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, BookOpen, Clock, Target, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeDetailDrawer } from '@/components/recipes/RecipeDetailDrawer';
import type { RecipeListResponse } from '@/services/types/recipes';

interface MissionRecipesSidebarProps {
  missionId: string;
  requiredSkillCodes: string[];
  trackCode: string;
  level?: string;
  className?: string;
}

export function MissionRecipesSidebar({
  missionId,
  requiredSkillCodes,
  trackCode,
  level,
  className = ''
}: MissionRecipesSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeListResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Build query params for recipes related to this mission
  const queryParams = {
    track_code: trackCode,
    level: level,
    skill_code: requiredSkillCodes.length > 0 ? requiredSkillCodes[0] : undefined, // Primary skill
  };

  const { recipes, loading, error } = useRecipes(queryParams, { autoFetch: false });

  // Filter recipes to only show those relevant to required skills
  const relevantRecipes = recipes.filter(recipe =>
    requiredSkillCodes.some(skill =>
      recipe.skill_code?.toLowerCase().includes(skill.toLowerCase()) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(skill.toLowerCase()))
    )
  ).slice(0, 3); // Limit to 3 most relevant

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
      <Card className={`border-slate-700/50 bg-slate-800/30 backdrop-blur-sm ${className}`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-200">Recipe Support</h3>
              <Badge variant="outline" className="text-xs bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                {relevantRecipes.length} recipes
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-400 mb-4">
            Practice these recipes to build the skills needed for this mission.
          </p>

          {/* Recipe List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-400">Failed to load recipes</p>
                    <Button variant="ghost" size="sm" className="text-xs mt-2">
                      Retry
                    </Button>
                  </div>
                ) : (
                  relevantRecipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group cursor-pointer"
                      onClick={() => handleRecipeClick(recipe)}
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 bg-slate-800/20 hover:bg-slate-700/30 hover:border-slate-600/50 transition-all">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                            {recipe.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{recipe.expected_duration_minutes}min</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Target className="w-3 h-3" />
                              <span className="capitalize">{recipe.difficulty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                            <ChevronDown className="w-3 h-3 text-slate-400 rotate-[-90deg]" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}

                {/* View All Link */}
                {relevantRecipes.length >= 3 && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      onClick={() => window.open('/dashboard/student/coaching/recipes', '_blank')}
                    >
                      View All Recipes
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Recipe Detail Drawer */}
      <RecipeDetailDrawer
        recipe={selectedRecipe}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
}
