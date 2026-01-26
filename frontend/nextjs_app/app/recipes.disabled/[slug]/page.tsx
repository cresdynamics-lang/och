/**
 * Recipe Detail Page
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import { RecipeDetailShell } from '@/components/recipes/RecipeDetailShell';
import { recipesClient, type RecipeDetailResponse } from '@/services/recipesClient';
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [recipe, setRecipe] = useState<RecipeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await recipesClient.getRecipe(slug);
        setRecipe(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load recipe');
        console.error('Error fetching recipe:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Recipe Not Found</h2>
          <p className="text-slate-400 mb-6">{error || `The recipe "${slug}" could not be loaded.`}</p>
          <Link href="/recipes">
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <RecipeDetailShell recipe={recipe} />;
}


