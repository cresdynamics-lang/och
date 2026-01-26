'use client'

import { useState } from 'react'
import { MetricCard } from '@/components/director/MetricCard'
import { PriorityAlert } from '@/components/director/PriorityAlert'
import Link from 'next/link'

interface MobileDashboardProps {
  hero: {
    active_cohorts: number
    seats_used: string
    avg_readiness: number
    completion_rate: string
  }
  alerts: Array<{
    priority: 'high' | 'medium' | 'low'
    title: string
    action: string
    cohort_id?: string
  }>
}

export function MobileDashboard({ hero, alerts }: MobileDashboardProps) {
  const [expandedAlerts, setExpandedAlerts] = useState(false)
  
  const seatsMatch = hero.seats_used.match(/(\d+)\/(\d+)/)
  const seatsUsed = seatsMatch ? parseInt(seatsMatch[1]) : 0
  const seatsTotal = seatsMatch ? parseInt(seatsMatch[2]) : 0
  const seatsPct = seatsTotal > 0 ? Math.round((seatsUsed / seatsTotal) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 lg:hidden">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">OCH</span>
          <button className="p-2">
            <span className="text-xl">☰</span>
          </button>
        </div>
      </header>

      {/* Collapsed Hero Metrics */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Cohorts</p>
            <p className="text-xl font-bold text-gray-900">{hero.active_cohorts}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Seats</p>
            <p className="text-xl font-bold text-gray-900">{seatsPct}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Readiness</p>
            <p className="text-xl font-bold text-gray-900">{hero.avg_readiness.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Completion</p>
            <p className="text-xl font-bold text-gray-900">{hero.completion_rate}</p>
          </div>
        </div>
      </div>

      {/* Alerts Section - Tap to expand */}
      {alerts.length > 0 && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setExpandedAlerts(!expandedAlerts)}
            className="w-full flex items-center justify-between"
          >
            <span className="text-sm font-semibold text-gray-900">
              🚨 {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
            </span>
            <span className="text-gray-400">{expandedAlerts ? '▼' : '▶'}</span>
          </button>
          
          {expandedAlerts && (
            <div className="mt-3 space-y-3">
              {alerts.map((alert, idx) => (
                <PriorityAlert
                  key={idx}
                  priority={alert.priority}
                  title={alert.title}
                  actions={[
                    { label: alert.action, href: alert.cohort_id ? `/dashboard/director/cohorts/${alert.cohort_id}` : undefined },
                  ]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cohorts Card Stack */}
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-gray-500">Swipe to view all cohorts</p>
        {/* Cohorts will be rendered as cards in mobile view */}
      </div>
    </div>
  )
}

