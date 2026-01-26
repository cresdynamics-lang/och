'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CohortRow {
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

interface CohortsTableProps {
  cohorts: CohortRow[]
  onRefresh?: () => void
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 7) {
    return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold">High Risk</span>
  }
  if (score >= 4) {
    return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-semibold">Medium Risk</span>
  }
  return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-semibold">Low Risk</span>
}

function TrendIndicator({ delta }: { delta: number }) {
  const isPositive = delta >= 0
  return (
    <span className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
    </span>
  )
}

export function CohortsTable({ cohorts, onRefresh }: CohortsTableProps) {
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCohorts = cohorts.filter(cohort => {
    const matchesSearch = cohort.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || 
      (filter === 'high' && cohort.risk_score >= 7) ||
      (filter === 'medium' && cohort.risk_score >= 4 && cohort.risk_score < 7) ||
      (filter === 'low' && cohort.risk_score < 4)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="bg-och-slate-800 rounded-lg border border-och-slate-700 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-och-mint">Cohorts</h2>
        
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search cohorts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-och-slate-900 border border-och-slate-700 rounded-lg text-och-steel focus:outline-none focus:border-och-mint"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-och-slate-900 border border-och-slate-700 rounded-lg text-och-steel focus:outline-none focus:border-och-mint"
          >
            <option value="all">All Cohorts</option>
            <option value="high">Risk: High</option>
            <option value="medium">Risk: Medium</option>
            <option value="low">Risk: Low</option>
          </select>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-och-slate-700">
              <th className="text-left py-3 px-4 text-och-steel font-semibold">Cohort</th>
              <th className="text-left py-3 px-4 text-och-steel font-semibold">Seats</th>
              <th className="text-left py-3 px-4 text-och-steel font-semibold">Readiness</th>
              <th className="text-left py-3 px-4 text-och-steel font-semibold">Completion</th>
              <th className="text-left py-3 px-4 text-och-steel font-semibold">Mentors</th>
              <th className="text-left py-3 px-4 text-och-steel font-semibold">Next Milestone</th>
              <th className="text-left py-3 px-4 text-och-steel font-semibold">Risk</th>
            </tr>
          </thead>
          <tbody>
            {filteredCohorts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-och-steel">
                  No cohorts found
                </td>
              </tr>
            ) : (
              filteredCohorts.map((cohort) => (
                <tr
                  key={cohort.cohort_id}
                  className="border-b border-och-slate-700 hover:bg-och-slate-900/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/director/cohorts/${cohort.cohort_id}`}
                      className="text-och-mint hover:underline font-medium"
                    >
                      {cohort.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-och-steel">{cohort.seats_used}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-och-steel">{cohort.readiness.toFixed(1)}%</span>
                      <TrendIndicator delta={cohort.readiness - 75} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-och-steel">{cohort.completion}</td>
                  <td className="py-3 px-4 text-och-steel">{cohort.mentor_coverage}</td>
                  <td className="py-3 px-4 text-och-steel text-sm">{cohort.next_milestone}</td>
                  <td className="py-3 px-4">
                    <RiskBadge score={cohort.risk_score} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

