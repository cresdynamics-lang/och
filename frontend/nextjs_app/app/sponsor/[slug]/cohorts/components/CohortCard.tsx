'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  BarChart3,
  Settings,
  FileText,
  UserPlus,
  Zap,
  ChevronRight,
  Eye,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface CohortCardProps {
  cohort: {
    id: string;
    name: string;
    track_slug: string;
    status: string;
    target_size: number;
    students_enrolled: number;
    active_students: number;
    completion_rate: number;
    start_date: string | null;
    target_completion_date: string | null;
    budget_allocated: number;
    ai_interventions_count: number;
    placement_goal: number;
    value_created_kes: number;
    avg_readiness_score: number;
    top_talent_count: number;
    at_risk_students: number;
    ai_alerts_count: number;
    is_over_budget: boolean;
    is_behind_schedule: boolean;
    needs_attention: boolean;
  };
  sponsorSlug: string;
  onAction?: (action: string, cohortId: string) => void;
}

const TRACK_COLORS = {
  defender: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30'
  },
  grc: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  innovation: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  leadership: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  offensive: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30'
  }
};

const STATUS_CONFIGS = {
  draft: { dot: '⚪', color: 'text-slate-400', label: 'Draft' },
  active: { dot: '🟢', color: 'text-emerald-400', label: 'Active' },
  graduated: { dot: '🎓', color: 'text-blue-400', label: 'Graduated' },
  archived: { dot: '📁', color: 'text-slate-500', label: 'Archived' }
};

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `KES ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `KES ${(amount / 1000).toFixed(0)}K`;
  }
  return `KES ${amount}`;
}

export function CohortCard({ cohort, sponsorSlug, onAction }: CohortCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trackConfig = TRACK_COLORS[cohort.track_slug as keyof typeof TRACK_COLORS] || TRACK_COLORS.defender;
  const statusConfig = STATUS_CONFIGS[cohort.status as keyof typeof STATUS_CONFIGS] || STATUS_CONFIGS.draft;

  const handleAction = (action: string) => {
    onAction?.(action, cohort.id);
  };

  return (
    <Card className={`p-6 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200 ${trackConfig.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${trackConfig.bg}`}>
            <BarChart3 className={`w-5 h-5 ${trackConfig.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-lg">{cohort.name}</h3>
              <Badge className={`${trackConfig.bg} ${trackConfig.text} text-xs px-2 py-1`}>
                {cohort.track_slug.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`${statusConfig.color} text-sm`}>{statusConfig.dot}</span>
              <span className="text-slate-400 text-sm">{statusConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Quick Status Indicators */}
        <div className="flex items-center gap-2">
          {cohort.needs_attention && (
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
              ⚠️ Attention
            </Badge>
          )}
          {cohort.at_risk_students > 0 && (
            <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">
              {cohort.at_risk_students} at risk
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <Users className="w-3 h-3" />
            <span>Students</span>
          </div>
          <p className="text-white font-semibold text-sm">{cohort.active_students}/{cohort.target_size}</p>
          <p className="text-slate-400 text-xs">{cohort.completion_rate.toFixed(1)}% complete</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            <span>Value</span>
          </div>
          <p className="text-white font-semibold text-sm">{formatCurrency(cohort.value_created_kes)}</p>
          <p className="text-slate-400 text-xs">created</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <Target className="w-3 h-3" />
            <span>Hires</span>
          </div>
          <p className="text-white font-semibold text-sm">12</p> {/* Mock data */}
          <p className="text-slate-400 text-xs">of {cohort.placement_goal} goal</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>Readiness</span>
          </div>
          <p className="text-white font-semibold text-sm">{cohort.avg_readiness_score.toFixed(1)}</p>
          <p className="text-slate-400 text-xs">avg score</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm">Overall Progress</span>
          <span className="text-white text-sm font-medium">{cohort.completion_rate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${trackConfig.text.replace('text-', 'bg-')}`}
            style={{ width: `${cohort.completion_rate}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'TBD'} - {' '}
            {cohort.target_completion_date ? new Date(cohort.target_completion_date).toLocaleDateString() : 'TBD'}
          </span>
        </div>
        {cohort.is_behind_schedule && (
          <Badge className="bg-red-500/20 text-red-400 text-xs">Behind Schedule</Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/sponsor/${sponsorSlug}/cohort/${cohort.id}/dashboard`}>
          <Button
            size="sm"
            className={`${trackConfig.text} border ${trackConfig.border} hover:bg-opacity-20 bg-transparent`}
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Dashboard
          </Button>
        </Link>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('edit')}
          className="text-slate-400 border-slate-600 hover:text-white"
        >
          <Settings className="w-3 h-3 mr-1" />
          Edit
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('boost')}
          className="text-slate-400 border-slate-600 hover:text-white"
        >
          <Zap className="w-3 h-3 mr-1" />
          Boost
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('add_students')}
          className="text-slate-400 border-slate-600 hover:text-white"
        >
          <UserPlus className="w-3 h-3 mr-1" />
          Add Students
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('export')}
          className="text-slate-400 border-slate-600 hover:text-white"
        >
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Budget Allocated:</span>
              <span className="text-white ml-2">{formatCurrency(cohort.budget_allocated)}</span>
              {cohort.is_over_budget && (
                <Badge className="bg-red-500/20 text-red-400 text-xs ml-2">Over Budget</Badge>
              )}
            </div>
            <div>
              <span className="text-slate-400">AI Interventions:</span>
              <span className="text-white ml-2">{cohort.ai_interventions_count}</span>
            </div>
            <div>
              <span className="text-slate-400">Top Talent:</span>
              <span className="text-white ml-2">{cohort.top_talent_count} students</span>
            </div>
            <div>
              <span className="text-slate-400">AI Alerts:</span>
              <span className="text-white ml-2">{cohort.ai_alerts_count} active</span>
            </div>
          </div>
        </div>
      )}

      {/* Expand Toggle */}
      <div className="mt-4 text-center">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-white"
        >
          {isExpanded ? 'Show Less' : 'Show More Details'}
          <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </Button>
      </div>
    </Card>
  );
}
