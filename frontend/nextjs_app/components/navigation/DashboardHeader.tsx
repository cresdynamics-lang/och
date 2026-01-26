'use client'

import { UserProfileDropdown } from './UserProfileDropdown'
import { Notifications } from './Notifications'
import { Breadcrumbs } from './Breadcrumbs'

/**
 * Generic dashboard header component that works for all roles
 * Uses role-aware navigation components
 */
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 bg-och-midnight/95 backdrop-blur-sm border-b border-och-steel/20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Breadcrumbs */}
        <div className="flex-1">
          <Breadcrumbs />
        </div>

        {/* Right side: Notifications and Profile */}
        <div className="flex items-center gap-4">
          <Notifications />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  )
}

