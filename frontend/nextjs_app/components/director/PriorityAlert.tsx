'use client'

import Link from 'next/link'

interface PriorityAlertProps {
  priority: 'high' | 'medium' | 'low'
  title: string
  cohort?: string
  actions: Array<{ label: string; href?: string; onClick?: () => void }>
}

const priorityStyles = {
  high: 'bg-red-50 border-red-500',
  medium: 'bg-amber-50 border-amber-500',
  low: 'bg-emerald-50 border-emerald-500',
}

const priorityIcons = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
}

export function PriorityAlert({ priority, title, cohort, actions }: PriorityAlertProps) {
  return (
    <div className={`p-6 rounded-2xl border-l-8 shadow-lg hover:shadow-xl transition-all ${priorityStyles[priority]}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">{priorityIcons[priority]}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          {cohort && <p className="text-sm text-gray-600 mt-1">{cohort}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, idx) => {
          if (action.href) {
            return (
              <Link
                key={idx}
                href={action.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  priority === 'high'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : priority === 'medium'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {action.label}
              </Link>
            )
          }
          return (
            <button
              key={idx}
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                priority === 'high'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : priority === 'medium'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

