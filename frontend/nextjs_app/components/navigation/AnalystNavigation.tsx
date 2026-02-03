'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'

interface NavItem {
  label: string
  hash: string
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'METRICS', hash: 'metrics' },
  { label: 'LEARNING', hash: 'learning' },
  { label: 'SIEM', hash: 'lab' },
  { label: 'TOOLS', hash: 'tools' },
  { label: 'REPORTS', hash: 'reports' },
  { label: 'CAREER', hash: 'career' },
]

export function AnalystNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentHash, setCurrentHash] = useState('')

  // Track hash changes
  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash.replace('#', ''))
    }

    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  const isActive = (hash: string) => {
    return pathname === '/dashboard/analyst' && currentHash === hash
  }

  const handleNavClick = (hash: string) => {
    if (pathname !== '/dashboard/analyst') {
      router.push('/dashboard/analyst')
    }
    window.location.hash = hash
    setCurrentHash(hash)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/90"
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
            <Link href="/dashboard/analyst" className="flex items-center">
              <span className="text-xl font-bold text-och-mint">OCH Analyst</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.hash)
              return (
                <button
                  key={item.hash}
                  onClick={() => handleNavClick(item.hash)}
                  className={clsx(
                    'flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-left',
                    'hover:bg-och-mint/20 hover:text-och-mint',
                    active
                      ? 'bg-och-mint/30 text-och-mint border-l-4 border-och-mint'
                      : 'text-och-steel'
                  )}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-och-orange text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom Section - Mobile only */}
          <div className="lg:hidden p-4 border-t border-och-steel/20">
            <div className="text-xs text-och-steel text-center">
              OCH Analyst v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
