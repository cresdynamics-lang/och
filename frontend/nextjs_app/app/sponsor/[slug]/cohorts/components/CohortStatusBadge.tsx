'use client';

import { Badge } from '@/components/ui/Badge';

interface CohortStatusBadgeProps {
  status: 'draft' | 'active' | 'graduated' | 'archived';
  className?: string;
}

const STATUS_CONFIGS = {
  draft: {
    icon: '⚪',
    label: 'Draft',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  },
  active: {
    icon: '🟢',
    label: 'Active',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  graduated: {
    icon: '🎓',
    label: 'Graduated',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  archived: {
    icon: '📁',
    label: 'Archived',
    color: 'bg-slate-600/20 text-slate-500 border-slate-600/30'
  }
};

export function CohortStatusBadge({ status, className = '' }: CohortStatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.draft;

  return (
    <Badge className={`${config.color} ${className}`}>
      {config.icon} {config.label}
    </Badge>
  );
}

// Track color utilities
export const TRACK_COLORS = {
  defender: {
    primary: '#0648A8',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    hover: 'hover:bg-emerald-500/10'
  },
  grc: {
    primary: '#4FAF47',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    hover: 'hover:bg-amber-500/10'
  },
  innovation: {
    primary: '#C89C15',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    hover: 'hover:bg-amber-500/10'
  },
  leadership: {
    primary: '#C89C15',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    hover: 'hover:bg-amber-500/10'
  },
  offensive: {
    primary: '#F55F28',
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    hover: 'hover:bg-orange-500/10'
  }
};

export function getTrackColor(trackSlug: string) {
  return TRACK_COLORS[trackSlug as keyof typeof TRACK_COLORS] || TRACK_COLORS.defender;
}

// Status priority for sorting
export const STATUS_PRIORITY = {
  active: 1,
  draft: 2,
  graduated: 3,
  archived: 4
};

export function sortCohortsByStatus(cohorts: any[]) {
  return [...cohorts].sort((a, b) => {
    const aPriority = STATUS_PRIORITY[a.status as keyof typeof STATUS_PRIORITY] || 99;
    const bPriority = STATUS_PRIORITY[b.status as keyof typeof STATUS_PRIORITY] || 99;
    return aPriority - bPriority;
  });
}
