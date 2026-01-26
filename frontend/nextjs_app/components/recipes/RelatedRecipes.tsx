/**
 * RelatedRecipes Component
 * 
 * Displays related recipes based on similar skills/tools.
 */
'use client';

import { Card } from '@/components/ui/Card';
import { RecipeCard } from './RecipeCard';
import Link from 'next/link';
import { recipesClient } from '@/services/recipesClient';
import { useEffect, useState } from 'react';
import type { Recipe } from '@/services/types/recipes';

interface RelatedRecipesProps {
  recipeId?: string;
  recipeSlug: string;
}

export function RelatedRecipes({ recipeSlug }: RelatedRecipesProps) {
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const recipes = await recipesClient.getRelatedRecipes(recipeSlug);
        setRelatedRecipes(recipes);
      } catch (error) {
        console.error('Failed to fetch related recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [recipeSlug]);

  if (loading || relatedRecipes.length === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-xl font-bold text-slate-200 mb-4">Related Recipes</h3>
      <div className="space-y-4">
        {relatedRecipes.slice(0, 3).map((recipe) => (
          <Link key={recipe.id} href={`/dashboard/student/coaching/recipes/${recipe.slug}`}>
            <div className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer">
              <h4 className="font-semibold text-slate-200 mb-2">{recipe.title}</h4>
              <p className="text-sm text-slate-400 line-clamp-2">{recipe.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}


