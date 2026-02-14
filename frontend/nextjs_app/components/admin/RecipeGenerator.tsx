'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Wand2, AlertCircle, CheckCircle } from 'lucide-react';
import { recipesClient } from '@/services/recipesClient';
import { type MissionTemplate } from '@/services/missionsClient';

interface RecipeGeneratorProps {
  missions: MissionTemplate[];
  onRecipeGenerated?: () => void;
}

export function RecipeGenerator({ missions, onRecipeGenerated }: RecipeGeneratorProps) {
  const [selectedMission, setSelectedMission] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateRecipes = async () => {
    if (!selectedMission) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedRecipes([]);

    try {
      const mission = missions.find(m => m.id === selectedMission);
      if (!mission) {
        setError('Mission not found');
        return;
      }

      // Get track_code from mission, fallback to track_key or default
      const trackCode = (mission as any).track_code || mission.track_key || 'GENERAL';

      const recipe = await recipesClient.generateRecipe({
        track_code: trackCode,
        level: 'beginner', // Default level
        skill_code: (trackCode || 'general').toLowerCase() + '_skills',
        goal_description: mission.description || `Generate a recipe for ${mission.title}`,
      });

      setGeneratedRecipes([recipe]);

      // Notify parent that a recipe was generated
      if (onRecipeGenerated) {
        onRecipeGenerated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-200 mb-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            AI Recipe Generator
          </h2>
          <p className="text-sm text-slate-400">
            Generate contextual recipes using Grok 3 AI based on mission requirements
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Mission</label>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Choose a mission to generate recipes for...</option>
                {missions.map(mission => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title} {(mission as any).track_code ? `(${(mission as any).track_code})` : mission.track_key ? `(${mission.track_key})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={generateRecipes}
            disabled={!selectedMission || isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Recipes...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Recipes
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}
        </div>
      </Card>

      {generatedRecipes.length > 0 && (
        <Card>
          <div className="p-6 border-b border-slate-800/50">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-green-400">
              <CheckCircle className="w-5 h-5" />
              Recipes Generated Successfully ({generatedRecipes.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {generatedRecipes.map((recipe, index) => (
                <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="font-semibold text-slate-200 mb-2">{recipe.title}</h4>
                  <p className="text-sm text-slate-400 mb-2">{recipe.summary}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {recipe.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {recipe.estimated_minutes}min
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}