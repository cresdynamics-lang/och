'use client'

import { SponsorDashboardSummary } from '@/services/sponsorClient'

interface SponsorSummaryCardProps {
  summary: SponsorDashboardSummary
}

export function SponsorSummaryCard({ summary }: SponsorSummaryCardProps) {
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0)
    if (isNaN(numAmount)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(numAmount)
  }

  return (
    <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
      <h2 className="text-2xl font-bold text-och-mint mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Seats Metrics */}
        <div className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700">
          <div className="text-och-steel text-sm mb-1">Total Seats</div>
          <div className="text-3xl font-bold text-och-mint">{summary.seats_total}</div>
          <div className="text-och-steel text-xs mt-1">
            {summary.seats_used} used ({summary.seats_total > 0 ? ((summary.seats_used / summary.seats_total) * 100).toFixed(1) : 0}%)
          </div>
        </div>

        <div className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700">
          <div className="text-och-steel text-sm mb-1">Seats at Risk</div>
          <div className="text-3xl font-bold text-red-400">{summary.seats_at_risk}</div>
          <div className="text-och-steel text-xs mt-1">Low completion</div>
        </div>

        {/* Budget Metrics */}
        <div className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700">
          <div className="text-och-steel text-sm mb-1">Budget Used</div>
          <div className="text-2xl font-bold text-och-mint">{formatCurrency(summary.budget_used)}</div>
          <div className="text-och-steel text-xs mt-1">
            {Number(summary.budget_used_pct || 0).toFixed(1)}% of {formatCurrency(summary.budget_total)}
          </div>
        </div>

        <div className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700">
          <div className="text-och-steel text-sm mb-1">Active Cohorts</div>
          <div className="text-3xl font-bold text-och-mint">{summary.active_cohorts_count}</div>
          <div className="text-och-steel text-xs mt-1">Running programs</div>
        </div>
      </div>

      {/* Talent Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700">
          <div className="text-och-steel text-sm mb-1">Avg Readiness</div>
          <div className="text-3xl font-bold text-och-mint">{Number(summary.avg_readiness || 0).toFixed(1)}%</div>
        </div>

        <div className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700">
          <div className="text-och-steel text-sm mb-1">Avg Completion</div>
          <div className="text-3xl font-bold text-och-mint">{Number(summary.avg_completion_pct || 0).toFixed(1)}%</div>
        </div>

        <div className="bg-och-slate-900 rounded-lg p-4 border border-och-slate-700">
          <div className="text-och-steel text-sm mb-1">Graduates</div>
          <div className="text-3xl font-bold text-och-mint">{summary.graduates_count}</div>
        </div>
      </div>

      {/* Alerts */}
      {summary.alerts && summary.alerts.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="text-yellow-400 font-semibold mb-2">Alerts</div>
          <ul className="list-disc list-inside text-och-steel space-y-1">
            {summary.alerts.map((alert, idx) => (
              <li key={idx}>{alert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

