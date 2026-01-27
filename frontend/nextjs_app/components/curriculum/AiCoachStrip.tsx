'use client';

import { useState, useEffect } from 'react';
import { Bot, Play, FileText, Target, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

interface Recommendation {
  type: 'video' | 'recipe' | 'mission';
  level_slug?: string;
  module_slug?: string;
  content_slug?: string;
  recipe_slug?: string;
  mission_slug?: string;
  reason: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_time?: string;
}

interface AiCoachStripProps {
  trackSlug?: string;
  onRecommendationClick?: (recommendation: Recommendation) => void;
}

function RecommendationItem({
  recommendation,
  onClick
}: {
  recommendation: Recommendation;
  onClick: () => void;
}) {
  const getIcon = () => {
    switch (recommendation.type) {
      case 'video':
        return <Play className="w-4 h-4 text-blue-400" />;
      case 'recipe':
        return <FileText className="w-4 h-4 text-green-400" />;
      case 'mission':
        return <Target className="w-4 h-4 text-orange-400" />;
      default:
        return <Target className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (recommendation.type) {
      case 'video':
        return 'Watch';
      case 'recipe':
        return 'Do';
      case 'mission':
        return 'Prepare';
      default:
        return 'View';
    }
  };

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <Card
      className="p-3 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white truncate">
              {recommendation.type === 'video' && recommendation.content_slug ?
                recommendation.content_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                recommendation.type === 'recipe' && recommendation.recipe_slug ?
                recommendation.recipe_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                recommendation.type === 'mission' && recommendation.mission_slug ?
                recommendation.mission_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                'Next Action'
              }
            </span>
            {recommendation.priority && (
              <Badge
                variant="outline"
                className={`text-xs border-0 ${getPriorityColor()} bg-transparent`}
              >
                {recommendation.priority}
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-400 line-clamp-1">
            {recommendation.reason}
          </p>

          {recommendation.estimated_time && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-slate-500">{recommendation.estimated_time}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </Card>
  );
}

export default function AiCoachStrip({ trackSlug = 'defender', onRecommendationClick }: AiCoachStripProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/users/${user.id}/coaching/recommendations?track_slug=${trackSlug}`);

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err: any) {
        console.error('Failed to fetch AI recommendations:', err);
        setError('Unable to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.id, trackSlug]);

  const handleRecommendationClick = (recommendation: Recommendation) => {
    if (onRecommendationClick) {
      onRecommendationClick(recommendation);
    } else {
      // Default navigation logic
      switch (recommendation.type) {
        case 'video':
          if (recommendation.level_slug && recommendation.module_slug && recommendation.content_slug) {
            window.location.href = `/curriculum/defender/${recommendation.level_slug}/${recommendation.module_slug}/${recommendation.content_slug}`;
          }
          break;
        case 'recipe':
          if (recommendation.recipe_slug) {
            // Navigate to recipe page (assuming it exists)
            window.location.href = `/recipes/${recommendation.recipe_slug}`;
          }
          break;
        case 'mission':
          if (recommendation.mission_slug) {
            // Navigate to mission page (assuming it exists)
            window.location.href = `/missions/${recommendation.mission_slug}`;
          }
          break;
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <div>
            <p className="text-sm font-medium text-white">🤖 AI Coach</p>
            <p className="text-xs text-slate-400">Analyzing your progress...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <Card className="p-4 bg-gradient-to-r from-slate-500/10 to-slate-600/10 border border-slate-500/20">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-white">🤖 AI Coach</p>
            <p className="text-xs text-slate-400">
              {error || 'No recommendations available at this time'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const progressContext = trackSlug === 'defender' ? '70% through Beginner' : 'Making progress';

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-sm font-medium text-white">🤖 AI Coach</p>
            <p className="text-xs text-slate-400">
              You're {progressContext}. Next best moves:
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <RecommendationItem
            key={`${recommendation.type}-${index}`}
            recommendation={recommendation}
            onClick={() => handleRecommendationClick(recommendation)}
          />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">
          Recommendations update after completing activities
        </p>
      </div>
    </Card>
  );
}
