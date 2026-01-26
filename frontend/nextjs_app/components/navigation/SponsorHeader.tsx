'use client'

import { useAuth } from '@/hooks/useAuth'
import { Breadcrumbs } from './Breadcrumbs'
import { Notifications } from './Notifications'
import { SponsorProfileDropdown } from './SponsorProfileDropdown'

export function SponsorHeader() {
  const { user } = useAuth()
  
  return (
    <header className="sticky top-0 z-30 bg-och-midnight/95 backdrop-blur-sm border-b border-och-steel/20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Breadcrumbs */}
        <div className="flex-1">
          <Breadcrumbs />
        </div>

        {/* Right side: Sponsor Info, Notifications and Profile */}
        <div className="flex items-center gap-6">
          {/* Sponsor Info */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {(user as any)?.organization_name || user?.email?.split('@')[1]?.split('.')[0] || 'Corporate Sponsor'}
              </div>
              <div className="text-xs text-och-steel">Seats: 250 | Budget: BWP 75K</div>
            </div>
          </div>
          
          <Notifications />
          <SponsorProfileDropdown />
        </div>
      </div>
    </header>
  )
}
