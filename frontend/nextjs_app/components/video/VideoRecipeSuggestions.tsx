'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, Users, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface RecipeSuggestion {
  slug: string;
  title: string;
  description: string;
  estimated_duration_minutes: number;
  completion_rate?: number;
  track_slug: string;
  level_slug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface VideoRecipeSuggestionsProps {
  trackSlug: string;
  levelSlug: string;
  moduleSlug: string;
  videoTitle: string;
  className?: string;
}

export function VideoRecipeSuggestions({
  trackSlug,
  levelSlug,
  moduleSlug,
  videoTitle,
  className = ''
}: VideoRecipeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchRecipeSuggestions();
  }, [trackSlug, levelSlug, moduleSlug]);

  const fetchRecipeSuggestions = async () => {
    try {
      // In production, this would fetch from the curriculum API to get module's supporting_recipes
      // For now, we'll use mock data based on the track/module
      const mockSuggestions = getMockRecipeSuggestions(trackSlug, levelSlug, moduleSlug);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to fetch recipe suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'intermediate':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'advanced':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getTrackColor = (track: string) => {
    switch (track) {
      case 'defender':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'grc':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'innovation':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'leadership':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'offensive':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <Card className={`p-4 bg-slate-900/50 border-slate-700 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-5 h-5 text-slate-400 animate-pulse" />
          <span className="text-slate-400 text-sm">Loading recipe suggestions...</span>
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const displaySuggestions = expanded ? suggestions : suggestions.slice(0, 2);

  return (
    <Card className={`bg-slate-900/50 border-slate-700 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">🤖 TRACK-SPECIFIC RECIPES</h3>
          </div>
          <span className="text-slate-400 text-xs">
            {Math.floor(suggestions[0]?.estimated_duration_minutes || 0)}min each
          </span>
        </div>

        <p className="text-slate-300 text-sm mb-4">
          Hands-on practice to reinforce "{videoTitle}"
        </p>

        <div className="space-y-3">
          {displaySuggestions.map((recipe, index) => (
            <Card key={recipe.slug} className="p-3 bg-slate-800/50 border-slate-600 hover:border-cyan-400/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium text-sm">{recipe.title}</h4>
                    <Badge className={`text-xs px-2 py-0.5 ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty}
                    </Badge>
                  </div>

                  <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.estimated_duration_minutes}min</span>
                    </div>

                    {recipe.completion_rate && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{recipe.completion_rate}% cohort</span>
                      </div>
                    )}

                    <Badge className={`text-xs px-1.5 py-0.5 ${getTrackColor(recipe.track_slug)}`}>
                      {recipe.track_slug}
                    </Badge>
                  </div>

                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-3 flex flex-col gap-2">
                  <Link href={`/recipes/${recipe.slug}`}>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-xs px-3 py-1">
                      <Play className="w-3 h-3 mr-1" />
                      START
                    </Button>
                  </Link>

                  <Link href={`/recipes/${recipe.slug}`}>
                    <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-400 hover:bg-cyan-400 hover:text-white text-xs px-3 py-1">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      VIEW
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {suggestions.length > 2 && (
          <div className="mt-4 pt-3 border-t border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 w-full"
            >
              {expanded ? (
                <>
                  Show Less
                  <ChevronRight className="w-4 h-4 ml-2 rotate-90" />
                </>
              ) : (
                <>
                  Show {suggestions.length - 2} More Recipes
                  <ChevronRight className="w-4 h-4 ml-2 -rotate-90" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Mock function to get recipe suggestions based on track/module
 * In production, this would fetch from the curriculum API
 */
function getMockRecipeSuggestions(trackSlug: string, levelSlug: string, moduleSlug: string): RecipeSuggestion[] {
  const recipeMappings: Record<string, Record<string, RecipeSuggestion[]>> = {
    defender: {
      'log-analysis-fundamentals': [
        {
          slug: 'defender-log-parsing-basics',
          title: 'Log Parsing Basics',
          description: 'Hands-on log parsing techniques for security events',
          estimated_duration_minutes: 18,
          completion_rate: 92,
          track_slug: 'defender',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['log_parsing', 'event_analysis', 'regex']
        },
        {
          slug: 'defender-siem-search-basics',
          title: 'SIEM Search Fundamentals',
          description: 'Basic query syntax for security information and event management',
          estimated_duration_minutes: 22,
          completion_rate: 87,
          track_slug: 'defender',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['siem_queries', 'search_syntax', 'log_correlation']
        },
        {
          slug: 'defender-event-correlation',
          title: 'Event Correlation Techniques',
          description: 'Connect related security events for threat detection',
          estimated_duration_minutes: 25,
          completion_rate: 78,
          track_slug: 'defender',
          level_slug: 'intermediate',
          difficulty: 'intermediate',
          tags: ['threat_detection', 'correlation', 'analysis']
        }
      ],
      'siem-searching-basics': [
        {
          slug: 'defender-advanced-siem-queries',
          title: 'Advanced SIEM Query Building',
          description: 'Complex search patterns and filtering techniques',
          estimated_duration_minutes: 28,
          completion_rate: 73,
          track_slug: 'defender',
          level_slug: 'intermediate',
          difficulty: 'intermediate',
          tags: ['advanced_queries', 'filtering', 'threat_hunting']
        }
      ]
    },
    offensive: {
      'recon-fundamentals': [
        {
          slug: 'offensive-nmap-basics',
          title: 'Nmap Scanning Fundamentals',
          description: 'Master Nmap for network reconnaissance and enumeration',
          estimated_duration_minutes: 25,
          completion_rate: 85,
          track_slug: 'offensive',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['network_scanning', 'enumeration', 'nmap']
        },
        {
          slug: 'offensive-osint-recon',
          title: 'OSINT Reconnaissance',
          description: 'Open source intelligence gathering techniques',
          estimated_duration_minutes: 20,
          completion_rate: 79,
          track_slug: 'offensive',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['osint', 'reconnaissance', 'intelligence']
        }
      ],
      'port-scanning-nmap': [
        {
          slug: 'offensive-nmap-scripting',
          title: 'Nmap Scripting Engine (NSE)',
          description: 'Automate complex scanning tasks with NSE scripts',
          estimated_duration_minutes: 30,
          completion_rate: 72,
          track_slug: 'offensive',
          level_slug: 'intermediate',
          difficulty: 'intermediate',
          tags: ['scripting', 'automation', 'vulnerability_scanning']
        }
      ]
    },
    grc: {
      'grc-foundations': [
        {
          slug: 'grc-risk-register-basics',
          title: 'Risk Register Creation',
          description: 'Build and maintain comprehensive risk registers',
          estimated_duration_minutes: 22,
          completion_rate: 81,
          track_slug: 'grc',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['risk_assessment', 'register_management', 'compliance']
        }
      ]
    },
    innovation: {
      'threat-research-basics': [
        {
          slug: 'innovation-osint-basics',
          title: 'OSINT for Innovation',
          description: 'Use open source intelligence to identify emerging threats',
          estimated_duration_minutes: 25,
          completion_rate: 69,
          track_slug: 'innovation',
          level_slug: 'beginner',
          difficulty: 'intermediate',
          tags: ['osint', 'threat_research', 'innovation']
        }
      ]
    },
    leadership: {
      'communication-security': [
        {
          slug: 'leadership-risk-communication',
          title: 'Risk Communication Frameworks',
          description: 'Structure your approach to communicating security risks',
          estimated_duration_minutes: 20,
          completion_rate: 91,
          track_slug: 'leadership',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['communication', 'risk_explanation', 'executive_briefing']
        }
      ]
    }
  };

  // Get recipes for this track/module combination
  const trackRecipes = recipeMappings[trackSlug] || {};
  const moduleRecipes = trackRecipes[moduleSlug] || [];

  return moduleRecipes;
}
