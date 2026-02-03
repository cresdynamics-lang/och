'use client';

import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Play,
  Award,
  BookOpen,
  Target,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import type { NextAction } from '@/lib/control-center';

interface NextActionsSectionProps {
  actions: NextAction[];
}

export function NextActionsSection({ actions }: NextActionsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Width of one card + gap
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'quiz':
        return <Award className="w-5 h-5" />;
      case 'recipe':
        return <BookOpen className="w-5 h-5" />;
      case 'mission':
        return <Target className="w-5 h-5" />;
      case 'assessment':
        return <CheckCircle className="w-5 h-5" />;
      case 'mentor_message':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getTrackColor = (trackSlug?: string) => {
    switch (trackSlug) {
      case 'defender':
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        };
      case 'grc':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        };
      case 'innovation':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        };
      case 'leadership':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        };
      case 'offensive':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
        };
      default:
        return {
          bg: 'bg-slate-500/20',
          border: 'border-slate-500/30',
          text: 'text-slate-400',
          badge: 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
        };
    }
  };

  const getPriorityBadge = (priority: number, badge?: string) => {
    if (badge) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {badge}
        </Badge>
      );
    }

    switch (priority) {
      case 1:
        return (
          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            HIGH PRIORITY
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            DUE SOON
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
            RECOMMENDED
          </Badge>
        );
      default:
        return null;
    }
  };

  const getActionButtonText = (type: string) => {
    switch (type) {
      case 'video':
        return 'WATCH';
      case 'quiz':
        return 'TAKE QUIZ';
      case 'recipe':
        return 'START RECIPE';
      case 'mission':
        return 'CONTINUE';
      case 'assessment':
        return 'START';
      case 'mentor_message':
        return 'REPLY';
      default:
        return 'START';
    }
  };

  if (actions.length === 0) {
    return (
      <Card className="p-8 bg-slate-900/50 border-slate-700 text-center">
        <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">All Caught Up!</h3>
        <p className="text-slate-400">
          You're all set for now. Check back later for new recommendations.
        </p>
      </Card>
    );
  }

  const trackColors = actions.map(action => getTrackColor(action.track_slug));

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="text-slate-400 border-slate-600 hover:text-white hover:border-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="text-slate-400 border-slate-600 hover:text-white hover:border-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-sm text-slate-400">
          {actions.length} action{actions.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {actions.map((action, index) => {
          const colors = trackColors[index];

          return (
            <Card
              key={action.id}
              className={`flex-shrink-0 w-80 p-6 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200 ${colors.border}`}
            >
              {/* Priority Badge */}
              <div className="mb-4">
                {getPriorityBadge(action.priority, action.badge)}
              </div>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <div className={colors.text}>
                    {getActionIcon(action.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-base mb-1 leading-tight">
                    {action.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-tight">
                    {action.subtitle}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="mb-4">
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                  {action.track_slug && (
                    <Badge className={colors.badge}>
                      {action.track_slug}
                    </Badge>
                  )}
                  {action.time_estimate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{action.time_estimate}</span>
                    </div>
                  )}
                </div>

                {/* Reason */}
                {action.reason && (
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {action.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Link href={action.action_url}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  {getActionButtonText(action.type)}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Scroll Indicator */}
      {actions.length > 3 && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(actions.length / 3) }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-slate-600"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
