'use client';

import { Badge } from '@/components/ui/Badge';

interface FinanceStatusBadgeProps {
  status: 'pending' | 'invoiced' | 'paid' | 'overdue';
  className?: string;
}

const STATUS_CONFIGS = {
  pending: {
    icon: '⏳',
    label: 'Pending',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  },
  invoiced: {
    icon: '📄',
    label: 'Invoiced',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  paid: {
    icon: '✅',
    label: 'Paid',
    color: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  overdue: {
    icon: '🚨',
    label: 'Overdue',
    color: 'bg-red-500/20 text-red-400 border-red-500/30'
  }
};

export function FinanceStatusBadge({ status, className = '' }: FinanceStatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;

  return (
    <Badge className={`${config.color} ${className}`}>
      {config.icon} {config.label}
    </Badge>
  );
}

// Finance theme colors (Sahara Gold)
export const FINANCE_THEME = {
  primary: '#C89C15',
  bg: '#0A0A0C',
  card: '#1A1A1E',
  success: '#33FFC1',
  warning: '#F55F28',
  accent: '#0648A8'
};
