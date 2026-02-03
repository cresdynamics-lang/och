'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Play, Award, BookOpen, Target, Clock, Users, Star, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface RecommendationAction {
  type: 'video' | 'quiz' | 'recipe' | 'assessment';
  track_slug?: string;
  level_slug?: string;
  module_slug?: string;
  content_slug?: string;
  recipe_slug?: string;
  title: string;
  description: string;
  reason: string;
  priority: number;
  estimated_duration_minutes?: number;
  skill_codes?: string[];
  cohort_completion_rate?: number;
}

interface AICoachRecommendationsProps {
  trackSlug?: string;
  className?: string;
}

export function AICoachRecommendations({
  trackSlug,
  className = ''
}: AICoachRecommendationsProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();
    }
  }, [user?.id, trackSlug]);

  const fetchRecommendations = async () => {
    try {
      const url = trackSlug
        ? `/api/users/${user?.id}/coaching/recommendations?track_slug=${trackSlug}`
        : `/api/users/${user?.id}/coaching/recommendations`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'video': return '▶️';
      case 'quiz': return '📝';
      case 'recipe': return '📚';
      case 'mission': return '🎯';
      case 'assessment': return '✅';
      case 'mentor_message': return '💬';
      default: return '📌';
    }
  };

  const getTrackColor = (trackSlug?: string) => {
    switch (trackSlug) {
      case 'defender': return 'text-emerald-400';
      case 'grc': return 'text-amber-400';
      case 'innovation': return 'text-amber-400';
      case 'leadership': return 'text-amber-400';
      case 'offensive': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getActionButtonText = (type: string) => {
    switch (type) {
      case 'video': return 'WATCH';
      case 'quiz': return 'TAKE';
      case 'recipe': return 'START';
      case 'assessment': return 'BEGIN';
      default: return 'START';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 bg-gradient-to-br from-amber-500/10 to-slate-900/30 border border-amber-500/20 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          <h3 className="text-white font-semibold">🤖 AI Coach Recommendations</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 bg-slate-800/50 border-slate-600">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-600 rounded mb-2"></div>
                <div className="h-3 bg-slate-600 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={`p-6 bg-slate-900/50 border-slate-700 ${className}`}>
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No recommendations yet</h3>
          <p className="text-slate-400">Complete some content to get personalized recommendations.</p>
        </div>
      </Card>
    );
  }

  const displayRecommendations = expanded ? recommendations : recommendations.slice(0, 3);

  return (
    <Card className={`bg-gradient-to-br from-amber-500/10 to-slate-900/30 border border-amber-500/20 ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h3 className="text-white font-bold text-lg">
            🤖 {trackSlug ? `${trackSlug.toUpperCase()} AI COACH` : 'YOUR NEXT 3 STEPS'}
          </h3>
        </div>

        <p className="text-slate-300 text-sm mb-6">
          {trackSlug
            ? `Personalized learning path for your ${trackSlug} journey`
            : 'Cross-track recommendations based on your progress and goals'
          }
        </p>

        <div className="space-y-4">
          {displayRecommendations.map((rec, index) => (
            <Card key={index} className="p-4 bg-slate-800/50 border-slate-600 hover:border-amber-400/50 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                      {rec.priority}
                    </div>
                    <span className="text-amber-400 text-sm">{getActionIcon(rec.type)}</span>
                    <Badge className={`text-xs px-2 py-0.5 ${getTrackColor(rec.track_slug)}`}>
                      {rec.track_slug || 'General'}
                    </Badge>
                  </div>

                  <h4 className="text-white font-semibold text-base mb-1">{rec.title}</h4>
                  <p className="text-slate-300 text-sm mb-3">{rec.description}</p>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">
                    <p className="text-amber-200 text-sm">
                      <Star className="w-4 h-4 inline mr-1" />
                      {rec.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {rec.estimated_duration_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{rec.estimated_duration_minutes}min</span>
                      </div>
                    )}
                    {rec.cohort_completion_rate && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{rec.cohort_completion_rate}% cohort</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  <Link href={rec.action_url || '#'}>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      {getActionButtonText(rec.type)}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {recommendations.length > 3 && (
          <div className="mt-6 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-white"
            >
              {expanded ? 'Show Less' : `Show ${recommendations.length - 3} More`}
              <ChevronRight className={`w-4 h-4 ml-2 ${expanded ? 'rotate-90' : '-rotate-90'}`} />
            </Button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              Want more personalized recommendations?
            </span>
            <Link href="/coaching">
              <Button variant="outline" size="sm" className="text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Full AI Coach
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}