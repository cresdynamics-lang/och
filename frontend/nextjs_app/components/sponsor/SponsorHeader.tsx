'use client'

import { useAuth } from '@/hooks/useAuth'

export function SponsorHeader() {
  const { user } = useAuth()
  
  return (
    <header className="sticky top-0 z-50 bg-och-midnight border-b border-och-steel/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-och-mint">OCH Sponsors</span>
          </div>
          
          {/* Sponsor Info */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {(user as any)?.organization_name || user?.email?.split('@')[1]?.split('.')[0] || 'Corporate Sponsor'}
                </div>
                <div className="text-xs text-och-steel">Seats: 250 | Budget: BWP 75K</div>
              </div>
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-och-midnight/80 transition-colors">
                <div className="w-8 h-8 bg-och-defender rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.first_name?.[0] || 'E'}
                </div>
                <span className="hidden md:block text-sm text-och-steel">Exec ▼</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

