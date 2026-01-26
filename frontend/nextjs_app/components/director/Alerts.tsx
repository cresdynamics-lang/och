'use client'

import Link from 'next/link'

interface Alert {
  priority: 'high' | 'medium' | 'low'
  title: string
  action: string
  cohort_id?: string
  mentor_id?: string
}

interface AlertsProps {
  alerts: Alert[]
}

const priorityStyles = {
  high: 'bg-red-500/10 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  medium: 'bg-amber-500/10 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  low: 'bg-blue-500/10 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
}

const priorityIcons = {
  high: '🚨',
  medium: '⚠️',
  low: 'ℹ️',
}

export function Alerts({ alerts }: AlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="mb-8 p-6 bg-och-slate-800 rounded-lg border border-och-slate-700">
        <p className="text-och-steel">No alerts at this time. All systems operational.</p>
      </div>
    )
  }

  return (
    <div className="mb-8 space-y-3">
      <h2 className="text-xl font-bold text-och-mint mb-4">Alerts</h2>
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-lg border-l-4 ${priorityStyles[alert.priority]} bg-gradient-to-r from-white/50 to-transparent dark:from-och-slate-800/50 dark:to-transparent`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{priorityIcons[alert.priority]}</span>
                <span className="font-semibold">{alert.title}</span>
              </div>
              {alert.cohort_id && (
                <Link
                  href={`/dashboard/director/cohorts/${alert.cohort_id}`}
                  className="text-sm text-och-mint hover:underline"
                >
                  {alert.action} →
                </Link>
              )}
              {!alert.cohort_id && (
                <span className="text-sm text-och-steel">{alert.action}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

