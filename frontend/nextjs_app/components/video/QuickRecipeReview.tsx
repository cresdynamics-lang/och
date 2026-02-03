'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, AlertTriangle, CheckCircle, ExternalLink, ChevronRight } from 'lucide-react';
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
  reason?: string; // Why this recipe is recommended for this quiz/assessment
}

interface QuickRecipeReviewProps {
  trackSlug: string;
  levelSlug: string;
  moduleSlug?: string;
  contentType: 'quiz' | 'assessment';
  contentTitle: string;
  passRate?: number;
  onContinue?: () => void;
  className?: string;
}

export function QuickRecipeReview({
  trackSlug,
  levelSlug,
  moduleSlug,
  contentType,
  contentTitle,
  passRate = 75,
  onContinue,
  className = ''
}: QuickRecipeReviewProps) {
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchRecipeSuggestions();
  }, [trackSlug, levelSlug, moduleSlug, contentType]);

  const fetchRecipeSuggestions = async () => {
    try {
      // In production, this would analyze quiz/assessment data to determine weak areas
      // and recommend specific recipes to address those gaps
      const mockSuggestions = getMockRecipeSuggestions(trackSlug, levelSlug, moduleSlug, contentType);
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

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'assessment':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-slate-400" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'assessment':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (dismissed || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-br from-amber-500/10 to-slate-900/30 border border-amber-500/20 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {getContentTypeIcon(contentType)}
          <div>
            <h3 className="text-white font-bold text-lg">
              📚 BEFORE YOU {contentType.toUpperCase()}: QUICK RECIPE REVIEW
            </h3>
            <p className="text-slate-300 text-sm">
              {contentTitle} • {passRate}% average pass rate
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <p className="text-amber-200 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Based on cohort performance data, these recipes address the most commonly missed topics.
            Spend 5-10 minutes reviewing to boost your chances of success!
          </p>
        </div>

        {/* Recipe Suggestions */}
        <div className="space-y-4 mb-6">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            RECOMMENDED RECIPES ({suggestions.length})
          </h4>

          {suggestions.map((recipe, index) => (
            <Card key={recipe.slug} className="p-4 bg-slate-800/50 border-slate-600">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400 font-bold text-sm">#{index + 1}</span>
                    <h5 className="text-white font-medium">{recipe.title}</h5>
                    <Badge className={`text-xs px-2 py-0.5 ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty}
                    </Badge>
                    <Badge className={`text-xs px-2 py-0.5 ${getTrackColor(recipe.track_slug)}`}>
                      {recipe.track_slug}
                    </Badge>
                  </div>

                  <p className="text-slate-300 text-sm mb-2">{recipe.description}</p>

                  {recipe.reason && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 mb-3">
                      <p className="text-blue-200 text-xs">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {recipe.reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.estimated_duration_minutes}min</span>
                    </div>
                    {recipe.completion_rate && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{recipe.completion_rate}% cohort</span>
                      </div>
                    )}
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

                <div className="ml-3 flex flex-col gap-2 flex-shrink-0">
                  <Link href={`/recipes/${recipe.slug}`}>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-xs px-3 py-1">
                      <Play className="w-3 h-3 mr-1" />
                      REVIEW
                    </Button>
                  </Link>

                  <Link href={`/recipes/${recipe.slug}`}>
                    <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-400 hover:bg-cyan-400 hover:text-white text-xs px-3 py-1">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      OPEN
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-slate-400 border-slate-600 hover:text-white"
          >
            Skip Review
          </Button>

          <Button
            onClick={onContinue}
            className="bg-amber-600 hover:bg-amber-700"
          >
            START {contentType.toUpperCase()}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-center">
          <p className="text-slate-500 text-xs">
            💡 Pro tip: Reviewing these recipes can increase your pass rate by 20-30%
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Mock function to get recipe suggestions based on track/level/module and content type
 * In production, this would analyze historical quiz/assessment performance data
 */
function getMockRecipeSuggestions(
  trackSlug: string,
  levelSlug: string,
  moduleSlug?: string,
  contentType?: string
): RecipeSuggestion[] {
  const recipeMappings: Record<string, Record<string, RecipeSuggestion[]>> = {
    defender: {
      'beginner': [
        {
          slug: 'defender-log-parsing-basics',
          title: 'Log Parsing Basics',
          description: 'Hands-on log parsing techniques for security events',
          estimated_duration_minutes: 18,
          completion_rate: 92,
          track_slug: 'defender',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['log_parsing', 'event_analysis', 'regex'],
          reason: 'Most missed quiz topic - log parsing fundamentals'
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
          tags: ['siem_queries', 'search_syntax', 'threat_detection'],
          reason: 'Commonly missed - query building and syntax'
        }
      ],
      'intermediate': [
        {
          slug: 'defender-event-correlation',
          title: 'Event Correlation Techniques',
          description: 'Connect related security events for threat detection',
          estimated_duration_minutes: 25,
          completion_rate: 78,
          track_slug: 'defender',
          level_slug: 'intermediate',
          difficulty: 'intermediate',
          tags: ['threat_detection', 'correlation', 'analysis'],
          reason: 'Advanced correlation concepts often misunderstood'
        }
      ]
    },
    offensive: {
      'beginner': [
        {
          slug: 'offensive-nmap-basics',
          title: 'Nmap Scanning Fundamentals',
          description: 'Master Nmap for network reconnaissance and enumeration',
          estimated_duration_minutes: 25,
          completion_rate: 85,
          track_slug: 'offensive',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['network_scanning', 'enumeration', 'nmap'],
          reason: 'Nmap syntax and options frequently confused'
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
          tags: ['osint', 'reconnaissance', 'intelligence'],
          reason: 'OSINT methodology and tool selection'
        }
      ]
    },
    grc: {
      'beginner': [
        {
          slug: 'grc-risk-register-basics',
          title: 'Risk Register Creation',
          description: 'Build and maintain comprehensive risk registers',
          estimated_duration_minutes: 22,
          completion_rate: 81,
          track_slug: 'grc',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['risk_assessment', 'register_management', 'compliance'],
          reason: 'Risk register concepts and practical implementation'
        }
      ]
    },
    leadership: {
      'beginner': [
        {
          slug: 'leadership-risk-communication',
          title: 'Risk Communication Frameworks',
          description: 'Structure your approach to communicating security risks',
          estimated_duration_minutes: 20,
          completion_rate: 91,
          track_slug: 'leadership',
          level_slug: 'beginner',
          difficulty: 'beginner',
          tags: ['communication', 'risk_explanation', 'executive_briefing'],
          reason: 'Executive communication frameworks and techniques'
        }
      ]
    },
    innovation: {
      'beginner': [
        {
          slug: 'innovation-osint-basics',
          title: 'OSINT for Innovation',
          description: 'Use open source intelligence to identify emerging threats',
          estimated_duration_minutes: 25,
          completion_rate: 69,
          track_slug: 'innovation',
          level_slug: 'beginner',
          difficulty: 'intermediate',
          tags: ['osint', 'threat_research', 'innovation'],
          reason: 'Applying OSINT concepts to innovative security solutions'
        }
      ]
    }
  };

  // Get recipes for this track/level combination
  const trackRecipes = recipeMappings[trackSlug] || {};
  const levelRecipes = trackRecipes[levelSlug] || [];

  // For quizzes, prioritize based on content type
  if (contentType === 'quiz') {
    return levelRecipes.slice(0, 2); // Show top 2 for quizzes
  } else if (contentType === 'assessment') {
    return levelRecipes.slice(0, 3); // Show top 3 for assessments
  }

  return levelRecipes.slice(0, 2); // Default to 2 suggestions
}
