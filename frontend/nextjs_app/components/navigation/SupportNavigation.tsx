'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Ticket,
  Hash,
  Settings,
  LifeBuoy,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/support/dashboard', icon: LayoutDashboard },
  { label: 'Tickets', href: '/support/tickets', icon: Ticket },
  { label: 'Problem Codes', href: '/support/problem-codes', icon: Hash },
  { label: 'Settings', href: '/support/settings', icon: Settings },
]

export function SupportNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/support/dashboard') {
      return pathname === '/support/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80"
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

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-och-midnight/90 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-full w-64 bg-och-midnight border-r border-och-steel/20 z-40 transition-transform duration-300',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-och-steel/20">
            <Link href="/support/dashboard" className="flex items-center gap-2">
              <LifeBuoy className="h-8 w-8 text-och-defender" aria-hidden />
              <span className="text-xl font-bold text-white">Support</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2" aria-label="Support navigation">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-och-defender/20 text-och-defender border border-och-defender/30'
                      : 'text-och-steel hover:text-white hover:bg-och-midnight/80'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="ml-auto bg-och-orange text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
