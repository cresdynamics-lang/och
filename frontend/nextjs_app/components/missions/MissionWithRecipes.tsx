import { useContextualRecipes } from '@/hooks/useContextualRecipes';
import { RecipePill } from '@/components/recipes/RecipePill';
import { Card } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  track_code: string;
  instructions?: string;
  required_skills?: string[];
}

interface MissionWithRecipesProps {
  mission: Mission;
  children: React.ReactNode;
}

export function MissionWithRecipes({ mission, children }: MissionWithRecipesProps) {
  const { recommendations, loading, error } = useContextualRecipes('mission', mission.id, mission.track_code);

  return (
    <div className="space-y-6">
      {/* Mission content */}
      {children}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
            🤖 AI Recommendations ({recommendations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((recipe) => (
              <RecipePill key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing mission context...</span>
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="p-6 border-orange-500/20 bg-orange-500/10">
          <p className="text-orange-400">
            Could not load AI recommendations: {error}
          </p>
        </Card>
      )}
    </div>
  );
}
