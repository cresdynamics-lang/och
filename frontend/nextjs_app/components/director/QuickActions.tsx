'use client'

import Link from 'next/link'

const actions = [
  { label: 'Programs', href: '/dashboard/director?tab=programs', icon: '🎯' },
  { label: 'Tracks', href: '/dashboard/director?tab=tracks', icon: '🛤️' },
  { label: 'Cohorts', href: '/dashboard/director?tab=cohorts', icon: '👥' },
  { label: 'New Cohort', href: '/dashboard/director/cohorts/new', icon: '➕' },
  { label: 'Manage Mentors', href: '/dashboard/director/mentors', icon: '👥' },
  { label: 'Define Rules', href: '/dashboard/director/rules', icon: '📋' },
  { label: 'Calendar', href: '/dashboard/director/calendar', icon: '📆' },
  { label: 'Reports', href: '/dashboard/director/reports', icon: '📊' },
]

export function QuickActions() {
  return (
    <div className="bg-och-slate-800 rounded-lg border border-och-slate-700 p-6 sticky top-4">
      <h3 className="text-lg font-bold text-och-mint mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-lg bg-och-slate-900 hover:bg-och-slate-700 transition-colors text-och-steel hover:text-och-mint"
          >
            <span className="text-xl">{action.icon}</span>
            <span className="font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

