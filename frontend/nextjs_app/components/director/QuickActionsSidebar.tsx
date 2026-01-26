'use client'

import Link from 'next/link'

const quickActions = [
  { label: 'Manage Mentors', href: '/dashboard/director/mentors', icon: '👥' },
  { label: 'Allocate Seats', href: '/dashboard/director/seats', icon: '💰' },
  { label: 'Generate Report', href: '/dashboard/director/reports', icon: '📊' },
  { label: 'Program Settings', href: '/dashboard/director/programs', icon: '⚙️' },
]

const recentActivities = [
  { text: 'Approved 15 enrollments', time: '2h ago' },
  { text: 'Rebalanced Cohort ABC', time: '5h ago' },
  { text: 'Created new program', time: '1d ago' },
]

export function QuickActionsSidebar() {
  return (
    <aside className="hidden lg:block lg:w-80 xl:w-96 sticky top-24 self-start">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <span className="text-sm text-gray-600">{activity.text}</span>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

