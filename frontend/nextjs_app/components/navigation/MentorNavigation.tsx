'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

interface NavItem {
  label: string
  href: string
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/mentor' },
  { label: 'Missions', href: '/dashboard/mentor/missions' },
  { label: 'Cohorts & Tracks', href: '/dashboard/mentor/cohorts-tracks' },
  { label: 'Sessions', href: '/dashboard/mentor/sessions' },
  { label: 'Messages', href: '/dashboard/mentor/messages' },
  { label: 'Analytics', href: '/dashboard/mentor/analytics' },
  { label: 'Profile', href: '/dashboard/mentor/profile' },
]

export function MentorNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard/mentor') {
      return pathname === '/dashboard/mentor'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/90"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-och-midnight/90 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full w-64 bg-och-midnight border-r border-och-steel/20 z-40 transition-transform duration-300',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-och-steel/20">
            <Link href="/dashboard/mentor" className="flex items-center gap-2">
              <span className="text-2xl">🧑‍🏫</span>
              <span className="text-xl font-bold text-och-mint">OCH Mentor</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center px-4 py-3 rounded-lg transition-all duration-200',
                    'hover:bg-och-defender/20 hover:text-och-mint',
                    active
                      ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-mint'
                      : 'text-och-steel'
                  )}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-och-orange text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Section - Mobile only */}
          <div className="lg:hidden p-4 border-t border-och-steel/20">
            <div className="text-xs text-och-steel text-center">
              OCH Mentor v1.0
            </div>
          </div>
        </div>
      </aside>

    </>
  )
}



