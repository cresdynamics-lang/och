'use client'

import { SponsorCodeGenerator } from './SponsorCodeGenerator'

const quickActions = [
  { label: 'Allocate 5 Seats', href: '/dashboard/sponsor/seats/allocate', icon: '➕' },
  { label: 'Bulk Assign Students', href: '/dashboard/sponsor/seats/bulk', icon: '📤' },
]

export function QuickSeatActions() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Quick Seat Actions</h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                {action.label}
              </span>
            </a>
          ))}
        </div>
      </div>
      
      {/* Sponsor Code Generator */}
      <SponsorCodeGenerator />
      
      {/* Top Graduates (Consent-gated) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💼 Top Graduates</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">Sarah M</span>
              <span className="text-sm font-semibold text-emerald-600">87% readiness</span>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View Profile 🔒
              <span className="text-gray-400 text-xs">(Consent required)</span>
            </button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">Ahmed K</span>
              <span className="text-sm font-semibold text-emerald-600">84% readiness</span>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View Profile 🔒
              <span className="text-gray-400 text-xs">(Consent required)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

