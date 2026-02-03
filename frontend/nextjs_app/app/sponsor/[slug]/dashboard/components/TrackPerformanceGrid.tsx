'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Shield,
  FileText,
  Rocket,
  Award,
  Target,
  Trophy,
  Building,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface TrackPerformance {
  track_slug: string;
  students_enrolled: number;
  completion_rate: number;
  avg_time_to_complete_days: number;
  top_performer: {
    student_name: string;
    completion_percentage: number;
    completion_time_days: number;
  };
  hiring_outcomes: {
    total_hires: number;
    avg_salary_kes: number;
    top_employer: string;
  };
}

interface TrackPerformanceGridProps {
  tracks: TrackPerformance[];
}

const TRACK_CONFIGS = {
  defender: {
    name: 'Defender',
    icon: Shield,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    gradient: 'from-emerald-500/10 to-slate-900/30'
  },
  grc: {
    name: 'GRC',
    icon: FileText,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    gradient: 'from-amber-500/10 to-slate-900/30'
  },
  innovation: {
    name: 'Innovation',
    icon: Rocket,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    gradient: 'from-amber-500/10 to-slate-900/30'
  },
  leadership: {
    name: 'Leadership',
    icon: Award,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    gradient: 'from-amber-500/10 to-slate-900/30'
  },
  offensive: {
    name: 'Offensive',
    icon: Target,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    gradient: 'from-orange-500/10 to-slate-900/30'
  }
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

export function TrackPerformanceGrid({ tracks }: TrackPerformanceGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tracks.map((track) => {
        const config = TRACK_CONFIGS[track.track_slug as keyof typeof TRACK_CONFIGS];
        if (!config) return null;

        const IconComponent = config.icon;

        return (
          <Card key={track.track_slug} className={`p-6 bg-gradient-to-br ${config.gradient} border ${config.borderColor} hover:border-opacity-60 transition-all duration-200`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{config.name} Track</h3>
                  <p className="text-slate-400 text-sm">{track.students_enrolled} students</p>
                </div>
              </div>
              <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor} text-xs`}>
                {track.completion_rate.toFixed(1)}%
              </Badge>
            </div>

            {/* Completion Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Completion Rate</span>
                <span className="text-white text-sm font-medium">{track.completion_rate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                  style={{ width: `${track.completion_rate}%` }}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Avg Time</span>
                </div>
                <p className="text-white font-semibold">{track.avg_time_to_complete_days}d</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                  <Trophy className="w-3 h-3" />
                  <span>Hires</span>
                </div>
                <p className="text-white font-semibold">{track.hiring_outcomes.total_hires}</p>
              </div>
            </div>

            {/* Top Performer */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300 text-sm font-medium">Top Performer</span>
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm font-medium">{track.top_performer.student_name}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{track.top_performer.completion_percentage.toFixed(1)}% complete</span>
                  <span>{track.top_performer.completion_time_days}d</span>
                </div>
              </div>
            </div>

            {/* Hiring Outcomes */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 text-sm font-medium">Hiring Outcomes</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Avg Salary</span>
                  <span className="text-white font-medium">{formatCurrency(track.hiring_outcomes.avg_salary_kes)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Top Employer</span>
                  <span className="text-white font-medium">{track.hiring_outcomes.top_employer}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              variant="outline"
              size="sm"
              className={`w-full ${config.color} border ${config.borderColor} hover:bg-opacity-20`}
            >
              View Track Details
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

