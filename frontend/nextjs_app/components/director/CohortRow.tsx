'use client'

import Link from 'next/link'

interface CohortRowProps {
  cohort: {
    cohort_id: string
    name: string
    seats_used: string
    readiness: number
    completion: string
    mentor_coverage: string
    risk_score: number
    next_milestone: string
    risk_flags: string[]
  }
  selected: boolean
  onSelect: (cohortId: string, checked: boolean) => void
}

function SeatBadge({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? (used / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-900">{used}/{total}</span>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function TrendChip({ delta }: { delta: number }) {
  const isPositive = delta >= 0
  const colorClass = isPositive ? 'text-emerald-600' : 'text-red-600'
  const icon = isPositive ? '↑' : '↓'
  
  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {icon} {Math.abs(delta).toFixed(1)}%
    </span>
  )
}

function ProgressBar({ pct, color = 'success' }: { pct: number; color?: 'success' | 'warning' | 'danger' }) {
  const colorClasses = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${colorClasses[color]}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900">{pct.toFixed(0)}%</span>
    </div>
  )
}

function StatusBadge({ coverage }: { coverage: string }) {
  const pct = parseFloat(coverage.replace('%', ''))
  const colorClass = pct >= 100 ? 'bg-emerald-100 text-emerald-700' : pct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {coverage}
    </span>
  )
}

function RiskIndicator({ score }: { score: number }) {
  if (score >= 7) {
    return <span className="text-red-600 font-bold">🔴 {score.toFixed(1)}</span>
  }
  if (score >= 4) {
    return <span className="text-amber-600 font-bold">🟡 {score.toFixed(1)}</span>
  }
  return <span className="text-emerald-600 font-bold">🟢 {score.toFixed(1)}</span>
}

export function CohortRow({ cohort, selected, onSelect }: CohortRowProps) {
  const completionPct = parseFloat(cohort.completion.replace('%', ''))
  const readinessDelta = cohort.readiness - 75 // Assuming 75 is baseline
  
  return (
    <tr className={`group hover:bg-gray-50/50 border-b border-gray-100 transition-all h-16 ${
      selected ? 'bg-blue-50 border-blue-200' : ''
    }`}>
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(cohort.cohort_id, e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/dashboard/director/cohorts/${cohort.cohort_id}`}
          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {cohort.name}
        </Link>
      </td>
      <td className="px-6 py-4">
        <SeatBadge
          used={parseInt(cohort.seats_used.split('/')[0])}
          total={parseInt(cohort.seats_used.split('/')[1])}
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">{cohort.readiness.toFixed(1)}%</span>
          <TrendChip delta={readinessDelta} />
        </div>
      </td>
      <td className="px-6 py-4">
        <ProgressBar
          pct={completionPct}
          color={completionPct >= 70 ? 'success' : completionPct >= 50 ? 'warning' : 'danger'}
        />
      </td>
      <td className="px-6 py-4">
        <StatusBadge coverage={cohort.mentor_coverage} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          {cohort.next_milestone}
        </span>
      </td>
      <td className="px-6 py-4">
        <RiskIndicator score={cohort.risk_score} />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/director/cohorts/${cohort.cohort_id}`}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            View
          </Link>
        </div>
      </td>
    </tr>
  )
}

