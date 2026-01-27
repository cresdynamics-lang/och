'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FinanceStatusBadge } from './FinanceStatusBadge';
import {
  DollarSign,
  TrendingUp,
  Target,
  FileText,
  Settings,
  Eye,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface CohortFinanceCardProps {
  cohort: {
    cohort_id: string;
    name: string;
    billed_amount: number;
    revenue_share: number;
    payment_status: string;
    hires: number;
    billing_month: string;
    invoices: number;
  };
  sponsorSlug: string;
  onAction?: (action: string, cohortId: string) => void;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
  return `KES ${amount}`;
}

export function CohortFinanceCard({ cohort, sponsorSlug, onAction }: CohortFinanceCardProps) {
  const handleAction = (action: string) => {
    onAction?.(action, cohort.cohort_id);
  };

  const netAmount = cohort.billed_amount - cohort.revenue_share;
  const roi = netAmount > 0 ? ((cohort.billed_amount + cohort.revenue_share) / netAmount) : 0;

  return (
    <Card className="p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate">{cohort.name}</h4>
          <p className="text-slate-400 text-xs">
            {new Date(cohort.billing_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
        <FinanceStatusBadge status={cohort.payment_status as any} />
      </div>

      {/* Financial Summary */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">Billed</span>
          <span className="text-white text-sm font-medium">{formatCurrency(cohort.billed_amount)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">Revenue Share</span>
          <span className="text-green-400 text-sm font-medium">-{formatCurrency(cohort.revenue_share)}</span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-700 pt-2">
          <span className="text-slate-300 text-xs font-medium">Net Due</span>
          <span className="text-white text-sm font-semibold">{formatCurrency(netAmount)}</span>
        </div>
      </div>

      {/* Hires & ROI */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-blue-400" />
          <span className="text-slate-400 text-xs">{cohort.hires} hires</span>
        </div>

        {roi > 0 && (
          <Badge className="bg-amber-500/20 text-amber-400 text-xs">
            {roi.toFixed(1)}x ROI
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1">
        <Link href={`/sponsor/${sponsorSlug}/finance/cohort/${cohort.cohort_id}`}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-slate-400 border-slate-600 hover:text-white text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </Link>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('download_invoice')}
          className="flex-1 text-slate-400 border-slate-600 hover:text-white text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          PDF
        </Button>

        {cohort.payment_status !== 'paid' && (
          <Button
            size="sm"
            onClick={() => handleAction('mark_paid')}
            className="bg-green-600 hover:bg-green-700 text-xs"
          >
            Pay
          </Button>
        )}
      </div>

      {/* Invoice Count */}
      {cohort.invoices > 0 && (
        <div className="mt-3 text-center">
          <span className="text-slate-400 text-xs">
            {cohort.invoices} invoice{cohort.invoices !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </Card>
  );
}
