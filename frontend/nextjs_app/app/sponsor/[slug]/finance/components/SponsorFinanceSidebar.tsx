'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CohortFinanceCard } from './CohortFinanceCard';
import { FinanceStatusBadge } from './FinanceStatusBadge';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  FileText,
  Settings,
  X,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';

interface FinanceSidebarProps {
  sponsorSlug: string;
  isOpen: boolean;
  onClose?: () => void;
  onFinanceAction?: (action: string, data?: any) => void;
}

interface FinanceOverview {
  total_roi: number;
  total_value_created: number;
  total_platform_cost: number;
  total_revenue_share: number;
  total_hires: number;
  cohorts: Array<{
    cohort_id: string;
    name: string;
    billed_amount: number;
    revenue_share: number;
    payment_status: string;
    hires: number;
    billing_month: string;
    invoices: number;
  }>;
  revenue_forecast_q2: number;
  payment_overdue: number;
}

export function SponsorFinanceSidebar({
  sponsorSlug,
  isOpen,
  onClose,
  onFinanceAction
}: FinanceSidebarProps) {
  const [financeData, setFinanceData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFinanceData();
    }
  }, [isOpen, sponsorSlug]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sponsors/${sponsorSlug}/finance/`, {
        headers: {
          // Add auth header when authentication is implemented
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch finance data: ${response.status}`);
      }

      const data: FinanceOverview = await response.json();
      setFinanceData(data);
    } catch (err: any) {
      console.error('Error fetching finance data:', err);
      setError(err.message || 'Failed to load finance data');

      // Mock data for development
      setFinanceData({
        total_roi: 4.2,
        total_value_created: 42700000,
        total_platform_cost: 10200000,
        total_revenue_share: 1280000,
        total_hires: 23,
        cohorts: [
          {
            cohort_id: '1',
            name: 'Jan 2026 - Defender',
            billed_amount: 3800000,
            revenue_share: 1280000,
            payment_status: 'paid',
            hires: 12,
            billing_month: '2026-01-01',
            invoices: 3
          },
          {
            cohort_id: '2',
            name: 'Feb 2026 - GRC',
            billed_amount: 2100000,
            revenue_share: 0,
            payment_status: 'overdue',
            hires: 0,
            billing_month: '2026-02-01',
            invoices: 1
          }
        ],
        revenue_forecast_q2: 8200000,
        payment_overdue: 2100000
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
    return `KES ${amount}`;
  };

  const handleFinanceAction = (action: string, data?: any) => {
    onFinanceAction?.(action, data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-950 border-l border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-80 md:flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Finance</h2>
            <p className="text-sm text-slate-400">ROI & Billing Overview</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => handleFinanceAction('settings')}
          className="text-slate-400 border-slate-600"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Error loading finance data</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <Button onClick={fetchFinanceData} size="sm">
              Retry
            </Button>
          </div>
        ) : financeData ? (
          <div className="p-4 space-y-6">
            {/* ROI Summary */}
            <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-slate-900/30 border-amber-500/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  {financeData.total_roi.toFixed(1)}x
                </div>
                <div className="text-slate-300 text-sm mb-2">Total ROI</div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>{formatCurrency(financeData.total_value_created)} created</div>
                  <div>{formatCurrency(financeData.total_platform_cost)} invested</div>
                </div>
              </div>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center">
                <div className="text-white font-semibold text-sm">
                  {formatCurrency(financeData.total_revenue_share)}
                </div>
                <div className="text-slate-400 text-xs">Revenue Share</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center">
                <div className="text-white font-semibold text-sm">
                  {financeData.total_hires}
                </div>
                <div className="text-slate-400 text-xs">Total Hires</div>
              </div>
            </div>

            {/* Overdue Alert */}
            {financeData.payment_overdue > 0 && (
              <Card className="p-3 bg-red-500/10 border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="text-red-400 text-sm font-medium">
                      {formatCurrency(financeData.payment_overdue)} Overdue
                    </div>
                    <div className="text-red-300 text-xs">
                      Payments require attention
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Revenue Forecast */}
            <Card className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm font-medium">Q2 Forecast</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  +{((financeData.revenue_forecast_q2 / (financeData.total_revenue_share || 1) - 1) * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="text-white font-semibold">
                {formatCurrency(financeData.revenue_forecast_q2)}
              </div>
              <div className="text-slate-400 text-xs">
                Expected revenue share
              </div>
            </Card>

            {/* Cohort Financial Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Cohort Billing</h3>
                <Button
                  size="sm"
                  onClick={() => handleFinanceAction('view_all_invoices')}
                  className="text-slate-400 border-slate-600 text-xs"
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {financeData.cohorts.map(cohort => (
                  <CohortFinanceCard
                    key={cohort.cohort_id}
                    cohort={cohort}
                    sponsorSlug={sponsorSlug}
                    onAction={handleFinanceAction}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => handleFinanceAction('generate_invoice')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>

              <Button
                onClick={() => handleFinanceAction('view_ledger')}
                variant="outline"
                className="w-full text-slate-400 border-slate-600"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Full Ledger
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile Close Button */}
      <div className="md:hidden p-4 border-t border-slate-800">
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full text-slate-400 border-slate-600"
        >
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </div>
    </div>
  );
}
