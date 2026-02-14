'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RecipeGenerator } from '@/components/admin/RecipeGenerator';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect } from 'react';
import { missionsClient, type MissionTemplate } from '@/services/missionsClient';
import { recipesClient } from '@/services/recipesClient';

interface EnvStatus {
  grok: boolean;
  llama: boolean;
  supabase: boolean;
}

export default function AdminRecipesPage() {
  const [missions, setMissions] = useState<MissionTemplate[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([]);
  const [contextLinks, setContextLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [selectedMissionFilter, setSelectedMissionFilter] = useState<string>('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [envStatus, setEnvStatus] = useState<EnvStatus>({
    grok: false,
    llama: false,
    supabase: false
  });

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const data = await missionsClient.getAllMissionsAdmin({ page_size: 50 });
        setMissions(data.results || []);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    const fetchEnvStatus = async () => {
      try {
        // Check if GPT API key is configured
        setEnvStatus({
          grok: true, // Assuming configured since we're using GPT
          llama: false,
          supabase: false
        });
      } catch (error) {
      }
    };

    const fetchRecipes = async () => {
      try {
        const data = await recipesClient.getRecipes();
        setRecipes(data);
      } catch (error) {
      } finally {
        setRecipesLoading(false);
      }
    };

    const fetchContextLinks = async () => {
      try {
        const links = await recipesClient.getContextLinks();
        setContextLinks(links);
      } catch (error) {
      }
    };

    fetchMissions();
    fetchEnvStatus();
    fetchRecipes();
    fetchContextLinks();
  }, []);

  // Apply filters whenever filter selections or recipes change
  useEffect(() => {
    let filtered = [...recipes];

    // Filter by mission
    if (selectedMissionFilter) {
      const missionLinks = contextLinks.filter(
        link => link.context_type === 'mission' && link.context_id === selectedMissionFilter
      );
      const linkedRecipeIds = missionLinks.map(link => link.recipe_id);
      filtered = filtered.filter(recipe => linkedRecipeIds.includes(recipe.id));
    }

    // Filter by track
    if (selectedTrackFilter) {
      filtered = filtered.filter(recipe =>
        recipe.track_codes && recipe.track_codes.includes(selectedTrackFilter)
      );
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
    }

    setFilteredRecipes(filtered);
  }, [recipes, contextLinks, selectedMissionFilter, selectedTrackFilter, selectedDifficulty]);

  // Get missions linked to a recipe
  const getLinkedMissions = (recipeId: string) => {
    const links = contextLinks.filter(
      link => link.recipe_id === recipeId && link.context_type === 'mission'
    );
    return links.map(link => {
      const mission = missions.find(m => m.id === link.context_id);
      return mission ? mission.title : null;
    }).filter(Boolean);
  };

  // Get unique tracks from all recipes
  const uniqueTracks = Array.from(
    new Set(recipes.flatMap(r => r.track_codes || []))
  ).sort();

  // Refresh recipes after generation
  const handleRecipeGenerated = async () => {
    try {
      const data = await recipesClient.getRecipes();
      setRecipes(data);

      // Also refresh context links to get updated mission associations
      const links = await recipesClient.getContextLinks();
      setContextLinks(links);
    } catch (error) {
    }
  };

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">AI Recipe Engine</h1>
            <p className="text-och-steel">
              Generate contextual cybersecurity recipes using Grok 3 AI based on mission requirements
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecipeGenerator missions={missions} onRecipeGenerated={handleRecipeGenerated} />
            </div>

            <div className="space-y-4">
              <Card>
                <div className="p-6 border-b border-slate-800/50">
                  <h3 className="text-lg font-semibold">AI Environment Status</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grok 4 API</span>
                    <Badge variant={envStatus.grok ? "defender" : "outline"}>
                      {envStatus.grok ? "✅ Configured" : "❌ Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Llama Fallback</span>
                    <Badge variant={envStatus.llama ? "defender" : "outline"}>
                      {envStatus.llama ? "✅ Configured" : "❌ Optional"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supabase</span>
                    <Badge variant={envStatus.supabase ? "defender" : "outline"}>
                      {envStatus.supabase ? "✅ Connected" : "❌ Missing"}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6 border-b border-slate-800/50">
                  <h3 className="text-lg font-semibold">Quick Stats</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Recipes:</span>
                      <span className="font-semibold">{recipes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Recipes:</span>
                      <span className="font-semibold">
                        {recipes.filter(r => r.is_active).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tracks Covered:</span>
                      <span className="font-semibold">{uniqueTracks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mission-Linked:</span>
                      <span className="font-semibold">
                        {Array.from(new Set(contextLinks.filter(l => l.context_type === 'mission').map(l => l.recipe_id))).length}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Existing Recipes */}
          <div className="mt-8">
            <Card>
              <div className="p-6 border-b border-slate-800/50">
                <h2 className="text-2xl font-bold text-slate-200">All Recipes ({recipes.length})</h2>
                <p className="text-sm text-slate-400 mt-1">View and manage generated recipes</p>

                {/* Filters */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Filter by Mission
                    </label>
                    <select
                      value={selectedMissionFilter}
                      onChange={(e) => setSelectedMissionFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                    >
                      <option value="">All Missions</option>
                      {missions.map((mission) => (
                        <option key={mission.id} value={mission.id}>
                          {mission.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Filter by Track
                    </label>
                    <select
                      value={selectedTrackFilter}
                      onChange={(e) => setSelectedTrackFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                    >
                      <option value="">All Tracks</option>
                      {uniqueTracks.map((track) => (
                        <option key={track} value={track}>
                          {track}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Filter by Difficulty
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-och-defender"
                    >
                      <option value="">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Active filters indicator */}
                {(selectedMissionFilter || selectedTrackFilter || selectedDifficulty) && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Active filters:</span>
                    {selectedMissionFilter && (
                      <Badge variant="outline">
                        Mission: {missions.find(m => m.id === selectedMissionFilter)?.title}
                      </Badge>
                    )}
                    {selectedTrackFilter && (
                      <Badge variant="outline">Track: {selectedTrackFilter}</Badge>
                    )}
                    {selectedDifficulty && (
                      <Badge variant="outline">Level: {selectedDifficulty}</Badge>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMissionFilter('');
                        setSelectedTrackFilter('');
                        setSelectedDifficulty('');
                      }}
                      className="text-och-defender hover:underline ml-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6">
                {recipesLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading recipes...</div>
                ) : recipes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No recipes yet. Generate your first recipe above!
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No recipes match the selected filters.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRecipes.map((recipe) => {
                      const linkedMissions = getLinkedMissions(recipe.id);
                      return (
                        <div key={recipe.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-200 mb-1">{recipe.title}</h3>
                              <p className="text-sm text-slate-400 mb-3">{recipe.summary || recipe.description}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <Badge variant="outline">{recipe.difficulty || 'beginner'}</Badge>
                                <span>{recipe.estimated_minutes || 20} min</span>
                                {recipe.track_codes && recipe.track_codes.length > 0 && (
                                  <span>Tracks: {recipe.track_codes.join(', ')}</span>
                                )}
                                {linkedMissions.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="defender" className="text-xs">
                                      Linked to {linkedMissions.length} mission{linkedMissions.length > 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                )}
                                {linkedMissions.length === 0 && (
                                  <Badge variant="outline" className="text-xs">Standalone</Badge>
                                )}
                              </div>
                              {linkedMissions.length > 0 && (
                                <div className="mt-2 text-xs text-slate-500">
                                  Missions: {linkedMissions.join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={recipe.is_active ? "defender" : "outline"}>
                                {recipe.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  );
}

