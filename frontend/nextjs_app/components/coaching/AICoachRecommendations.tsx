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
  trackSlug?: string; // Optional - if not provided, shows cross-track recommendations
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
        // Fallback to mock data if API fails
        setRecommendations(getMockRecommendations(trackSlug));
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations(getMockRecommendations(trackSlug));
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'quiz':
        return <Award className="w-4 h-4" />;
      case 'recipe':
        return <BookOpen className="w-4 h-4" />;
      case 'assessment':
        return <Target className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'quiz':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'recipe':
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      case 'assessment':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getTrackColor = (track: string) => {
    switch (track) {
      case 'defender':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'grc':
        return 'text-amber-400 bg-amber-500/10';
      case 'innovation':
        return 'text-amber-400 bg-amber-500/10';
      case 'leadership':
        return 'text-amber-400 bg-amber-500/10';
      case 'offensive':
        return 'text-orange-400 bg-orange-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getActionLink = (action: RecommendationAction) => {
    switch (action.type) {
      case 'video':
        return `/curriculum/${action.track_slug}/${action.level_slug}/${action.module_slug}/${action.content_slug}`;
      case 'quiz':
        return `/curriculum/${action.track_slug}/${action.level_slug}/${action.module_slug}/quiz/${action.content_slug}`;
      case 'recipe':
        return `/recipes/${action.recipe_slug}`;
      case 'assessment':
        return `/curriculum/${action.track_slug}/${action.level_slug}/assessment/${action.content_slug}`;
      default:
        return '#';
    }
  };

  const getActionButtonText = (type: string) => {
    switch (type) {
      case 'video':
        return 'WATCH';
      case 'quiz':
        return 'TAKE';
      case 'recipe':
        return 'START';
      case 'assessment':
        return 'BEGIN';
      default:
        return 'START';
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
    return null;
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
          {!trackSlug && (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
              All Tracks
            </Badge>
          )}
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
                  {/* Priority indicator and type */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                      {rec.priority}
                    </div>
                    <Badge className={`text-xs px-2 py-0.5 ${getActionColor(rec.type)}`}>
                      {getActionIcon(rec.type)}
                      <span className="ml-1 capitalize">{rec.type}</span>
                    </Badge>
                    {rec.track_slug && (
                      <Badge className={`text-xs px-2 py-0.5 ${getTrackColor(rec.track_slug)}`}>
                        {rec.track_slug}
                      </Badge>
                    )}
                  </div>

                  {/* Title and description */}
                  <h4 className="text-white font-semibold text-base mb-1">{rec.title}</h4>
                  <p className="text-slate-300 text-sm mb-3">{rec.description}</p>

                  {/* Reason */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">
                    <p className="text-amber-200 text-sm">
                      <Star className="w-4 h-4 inline mr-1" />
                      {rec.reason}
                    </p>
                  </div>

                  {/* Metadata */}
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

                    {rec.skill_codes && rec.skill_codes.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{rec.skill_codes.slice(0, 2).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="ml-4 flex-shrink-0">
                  <Link href={getActionLink(rec)}>
                    <Button className="bg-amber-600 hover:bg-amber-700 whitespace-nowrap">
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
              {expanded ? (
                <>
                  Show Less Recommendations
                  <ChevronRight className="w-4 h-4 ml-2 rotate-90" />
                </>
              ) : (
                <>
                  Show {recommendations.length - 3} More Recommendations
                  <ChevronRight className="w-4 h-4 ml-2 -rotate-90" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Footer with link to full coaching dashboard */}
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
      </Card>
    </Card>
  );
}

/**
 * Mock recommendations for development/fallback
 */
function getMockRecommendations(trackSlug?: string): RecommendationAction[] {
  if (trackSlug === 'defender') {
    return [
      {
        type: 'video',
        track_slug: 'defender',
        level_slug: 'beginner',
        module_slug: 'log-analysis-fundamentals',
        content_slug: 'event-viewer-basics',
        title: 'Event Viewer Basics',
        description: 'Master Windows Event Viewer for log analysis',
        reason: 'You scored 78% on logs quiz. This video teaches Event Viewer filtering techniques.',
        priority: 1,
        estimated_duration_minutes: 8,
        skill_codes: ['log_parsing', 'event_analysis'],
        cohort_completion_rate: 87
      },
      {
        type: 'recipe',
        recipe_slug: 'defender-log-parsing-basics',
        track_slug: 'defender',
        title: 'Log Parsing Basics',
        description: 'Hands-on log parsing techniques',
        reason: 'Strengthen your log analysis skills with practical exercises.',
        priority: 2,
        estimated_duration_minutes: 18,
        skill_codes: ['log_parsing', 'regex_patterns'],
        cohort_completion_rate: 92
      },
      {
        type: 'quiz',
        track_slug: 'defender',
        level_slug: 'beginner',
        module_slug: 'siem-searching-basics',
        content_slug: 'basic-search-syntax-quiz',
        title: 'SIEM Search Quiz',
        description: 'Test your SIEM query building skills',
        reason: 'Unlocks intermediate level Defender content.',
        priority: 3,
        skill_codes: ['siem_queries', 'threat_detection']
      }
    ];
  }

  // Cross-track recommendations
  return [
    {
      type: 'video',
      track_slug: 'offensive',
      level_slug: 'beginner',
      module_slug: 'recon-fundamentals',
      content_slug: 'active-vs-passive-recon',
      title: 'Active vs Passive Reconnaissance',
      description: 'Learn offensive reconnaissance techniques',
      reason: 'Your defensive log analysis skills make you ready for offensive reconnaissance.',
      priority: 1,
      estimated_duration_minutes: 12,
      skill_codes: ['passive_recon', 'active_scanning'],
      cohort_completion_rate: 78
    },
    {
      type: 'recipe',
      recipe_slug: 'leadership-risk-communication',
      track_slug: 'leadership',
      title: 'Risk Communication Frameworks',
      description: 'Bridge technical and business understanding',
      reason: 'Strengthen your communication skills to explain technical concepts clearly.',
      priority: 2,
      estimated_duration_minutes: 20,
      skill_codes: ['executive_communication', 'risk_explanation'],
      cohort_completion_rate: 91
    },
    {
      type: 'video',
      track_slug: 'innovation',
      level_slug: 'beginner',
      module_slug: 'threat-research-basics',
      content_slug: 'osint-methodology',
      title: 'OSINT Methodology',
      description: 'Systematic approach to open source intelligence',
      reason: 'Apply your technical knowledge to create innovative security approaches.',
      priority: 3,
      estimated_duration_minutes: 14,
      skill_codes: ['osint_analysis', 'threat_intelligence'],
      cohort_completion_rate: 69
    }
  ];
}
