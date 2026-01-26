'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { useNavigation } from '@/hooks/useNavigation'
import { getPrimaryRole } from '@/utils/rbac'

// Helper function to get role display name
function getRoleDisplayName(role: string | null): string {
  if (!role) return 'Director'
  
  const roleMap: Record<string, string> = {
    'student': 'Student',
    'mentee': 'Student',
    'mentor': 'Mentor',
    'admin': 'Admin',
    'program_director': 'Program Director',
    'sponsor_admin': 'Sponsor',
    'employer': 'Employer',
    'analyst': 'Analyst',
    'finance': 'Finance Director',
  }
  
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')
}

interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
  priority?: 'high' | 'medium' | 'low'
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard/director', icon: '📊', priority: 'high' },
  { label: 'Manage Programs', href: '/dashboard/director/programs', icon: '📋', priority: 'high' },
  { 
    label: 'Programs & Cohorts', 
    href: '/dashboard/director/programs', 
    icon: '🎯',
    priority: 'high',
    children: [
      { label: 'All Programs', href: '/dashboard/director/programs', icon: '📋' },
      { label: 'All Tracks', href: '/dashboard/director/tracks', icon: '🛤️' },
      { label: 'Create Program', href: '/dashboard/director/programs/new', icon: '➕' },
      { label: 'Create Cohort', href: '/dashboard/director/cohorts/new', icon: '📅' },
      { label: 'Manage Cohorts', href: '/dashboard/director/cohorts', icon: '👥' },
    ]
  },
  { 
    label: 'Enrollment & Placement', 
    href: '/dashboard/director/enrollment', 
    icon: '✅',
    priority: 'high',
    children: [
      { label: 'Pending Approvals', href: '/dashboard/director/enrollment', icon: '⏳' },
      { label: 'Override Placements', href: '/dashboard/director/enrollment/overrides', icon: '🔄' },
      { label: 'Seat Allocation', href: '/dashboard/director/enrollment/seats', icon: '🎫' },
    ]
  },
  { 
    label: 'Mentorship Management', 
    href: '/dashboard/director/mentorship', 
    icon: '🤝',
    priority: 'high',
    children: [
      { label: 'View All Mentors', href: '/dashboard/director/mentors', icon: '👥' },
      { label: 'Auto-Matching', href: '/dashboard/director/mentorship/matching', icon: '🔀' },
      { label: 'Mentor Reviews', href: '/dashboard/director/mentorship/reviews', icon: '⭐' },
      { label: 'Cycle Configuration', href: '/dashboard/director/mentorship/cycles', icon: '🔄' },
    ]
  },
  { 
    label: 'Curriculum & Missions', 
    href: '/dashboard/director/curriculum', 
    icon: '📚',
    priority: 'medium',
    children: [
      { label: 'Define Structure', href: '/dashboard/director/curriculum', icon: '📐' },
      { label: 'Manage Missions', href: '/dashboard/director/curriculum/missions', icon: '🚀' },
      { label: 'Scoring Rules', href: '/dashboard/director/curriculum/scoring', icon: '📊' },
      { label: 'Assessment Windows', href: '/dashboard/director/curriculum/assessments', icon: '📝' },
    ]
  },
  { label: 'Analytics & Reports', href: '/dashboard/director/analytics', icon: '📈', priority: 'medium' },
  { label: 'Calendar & Milestones', href: '/dashboard/director/calendar', icon: '📆', priority: 'medium' },
  { label: 'Settings & Rules', href: '/dashboard/director/settings', icon: '⚙️', priority: 'low' },
]

export function DirectorNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const {
    expandedItems,
    toggleExpanded,
    searchQuery,
    setSearchQuery,
  } = useNavigation({ storageKey: 'director-nav-expanded', autoExpandActive: true })

  // Get primary role dynamically
  const primaryRole = useMemo(() => getPrimaryRole(user), [user])
  const roleDisplayName = useMemo(() => getRoleDisplayName(primaryRole), [primaryRole])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  const handleLogout = async () => {
    setIsProfileOpen(false)
    await logout()
    router.push('/login/director')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/director') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  // Auto-expand items with active children
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => isActive(child.href))
        if (hasActiveChild && !expandedItems.has(item.label)) {
          toggleExpanded(item.label)
        }
      }
    })
  }, [pathname])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
        setIsProfileOpen(false)
        setShowSearch(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Filter nav items by search query
  const filteredNavItems = useMemo(() => {
    if (!searchQuery) return navItems

    const query = searchQuery.toLowerCase()
    return navItems
      .map((item) => {
        const matchesLabel = item.label.toLowerCase().includes(query)
        const matchingChildren = item.children?.filter(
          (child) => child.label.toLowerCase().includes(query) || child.href.toLowerCase().includes(query)
        )

        if (matchesLabel || (matchingChildren && matchingChildren.length > 0)) {
          return {
            ...item,
            children: matchingChildren || item.children,
          }
        }
        return null
      })
      .filter(Boolean) as NavItem[]
  }, [searchQuery])

  // Separate high priority items
  const highPriorityItems = useMemo(() => navItems.filter(item => item.priority === 'high'), [])
  const otherItems = useMemo(() => navItems.filter(item => item.priority !== 'high'), [])

  // Expand all function that works with nav items
  const handleExpandAll = useCallback(() => {
    const allItemsWithChildren = navItems.filter((item) => item.children && item.children.length > 0)
    if (typeof window !== 'undefined') {
      try {
        const newExpanded = new Set(allItemsWithChildren.map((item) => item.label))
        localStorage.setItem('director-nav-expanded', JSON.stringify(Array.from(newExpanded)))
        // Update state by manually setting expanded items
        allItemsWithChildren.forEach((item) => {
          if (!expandedItems.has(item.label)) {
            toggleExpanded(item.label)
          }
        })
      } catch (err) {
        console.error('Failed to save navigation state:', err)
      }
    }
  }, [navItems, expandedItems, toggleExpanded])

  // Collapse all function
  const handleCollapseAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('director-nav-expanded', JSON.stringify([]))
        // Collapse all by toggling each expanded item
        expandedItems.forEach((label) => {
          toggleExpanded(label)
        })
      } catch (err) {
        console.error('Failed to save navigation state:', err)
      }
    }
  }, [expandedItems, toggleExpanded])

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/90 shadow-lg"
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
          className="lg:hidden fixed inset-0 bg-och-midnight/95 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full w-64 bg-och-midnight border-r border-och-steel/20 z-40 transition-transform duration-300 flex flex-col',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-och-steel/20">
          <Link href="/dashboard/director" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold text-och-defender">Program Director</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-och-steel/20">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              placeholder="Search navigation... (Ctrl+K)"
              className="w-full px-4 py-2 pl-10 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm placeholder-och-steel focus:outline-none focus:border-och-defender transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-och-steel"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-och-steel hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expand/Collapse Controls */}
        {!searchQuery && (
          <div className="px-4 py-2 border-b border-och-steel/20 flex gap-2">
            <button
              onClick={handleExpandAll}
              className="flex-1 px-3 py-1.5 text-xs bg-och-defender/20 text-och-defender rounded hover:bg-och-defender/30 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="flex-1 px-3 py-1.5 text-xs bg-och-steel/20 text-och-steel rounded hover:bg-och-steel/30 transition-colors"
            >
              Collapse All
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* High Priority Section */}
          {highPriorityItems.length > 0 && (
            <div className="mb-4">
              {!searchQuery && (
                <div className="px-4 py-2 mb-2">
                  <p className="text-xs font-semibold text-och-orange uppercase tracking-wider">Priority Actions</p>
                </div>
              )}
              {(searchQuery ? filteredNavItems.filter((i) => i.priority === 'high') : highPriorityItems).map((item) => {
                const active = isActive(item.href)
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedItems.has(item.label)

                return (
                  <div key={item.href}>
                    {hasChildren ? (
                      <>
                        <button
                          onClick={() => toggleExpanded(item.label)}
                          className={clsx(
                            'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                            'hover:bg-och-defender/20 hover:text-och-mint border-l-2 border-och-orange/50',
                            active
                              ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-orange'
                              : 'text-och-steel'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <span className="text-och-steel">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </button>
                        {isExpanded && item.children && (
                          <div
                            className={clsx(
                              'ml-4 mt-1 space-y-1 border-l border-och-steel/20 pl-4 overflow-hidden transition-all duration-300',
                              isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                            )}
                          >
                            {item.children?.map((child) => {
                              const childActive = isActive(child.href)
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={clsx(
                                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm',
                                    'hover:bg-och-defender/20 hover:text-och-mint',
                                    childActive
                                      ? 'bg-och-defender/30 text-och-mint'
                                      : 'text-och-steel'
                                  )}
                                >
                                  <span className="text-lg">{child.icon}</span>
                                  <span>{child.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-2 border-och-orange/50',
                          'hover:bg-och-defender/20 hover:text-och-mint',
                          active
                            ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-orange'
                            : 'text-och-steel'
                        )}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto px-2 py-0.5 text-xs bg-och-orange text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Other Items Section */}
          {!searchQuery && (
            <div className="mt-4 pt-4 border-t border-och-steel/20">
              {otherItems.map((item) => {
              const active = isActive(item.href)
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedItems.has(item.label)

              return (
                <div key={item.href}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={clsx(
                          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                          'hover:bg-och-defender/20 hover:text-och-mint',
                          active
                            ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-mint'
                            : 'text-och-steel'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <span className="text-och-steel">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </button>
                      {isExpanded && item.children && (
                        <div
                          className={clsx(
                            'ml-4 mt-1 space-y-1 border-l border-och-steel/20 pl-4 overflow-hidden transition-all duration-300',
                            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                          )}
                        >
                          {item.children.map((child) => {
                            const childActive = isActive(child.href)
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm',
                                  'hover:bg-och-defender/20 hover:text-och-mint',
                                  childActive
                                    ? 'bg-och-defender/30 text-och-mint'
                                    : 'text-och-steel'
                                )}
                              >
                                <span className="text-lg">{child.icon}</span>
                                <span>{child.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        'hover:bg-och-defender/20 hover:text-och-mint',
                        active
                          ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-mint'
                          : 'text-och-steel'
                      )}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto px-2 py-0.5 text-xs bg-och-orange text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              )
            })}
            </div>
          )}
          {/* Show all filtered items when searching */}
          {searchQuery && (
            <div className="space-y-1">
              {filteredNavItems
                .filter((item) => item.priority !== 'high')
                .map((item) => {
                  const active = isActive(item.href)
                  const hasChildren = item.children && item.children.length > 0
                  const isExpanded = expandedItems.has(item.label)

                  return (
                    <div key={item.href}>
                      {hasChildren ? (
                        <>
                          <button
                            onClick={() => toggleExpanded(item.label)}
                            className={clsx(
                              'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                              'hover:bg-och-defender/20 hover:text-och-mint',
                              active
                                ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-mint'
                                : 'text-och-steel'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.icon}</span>
                              <span className="font-medium">{item.label}</span>
                            </div>
                            <span className="text-och-steel">{isExpanded ? '▼' : '▶'}</span>
                          </button>
                          {isExpanded && item.children && (
                            <div
                              className={clsx(
                                'ml-4 mt-1 space-y-1 border-l border-och-steel/20 pl-4 overflow-hidden transition-all duration-300',
                                isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                              )}
                            >
                              {item.children.map((child) => {
                                const childActive = isActive(child.href)
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={clsx(
                                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm',
                                      'hover:bg-och-defender/20 hover:text-och-mint',
                                      childActive
                                        ? 'bg-och-defender/30 text-och-mint'
                                        : 'text-och-steel'
                                    )}
                                  >
                                    <span className="text-lg">{child.icon}</span>
                                    <span>{child.label}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={clsx(
                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                            'hover:bg-och-defender/20 hover:text-och-mint',
                            active
                              ? 'bg-och-defender/30 text-och-mint border-l-4 border-och-mint'
                              : 'text-och-steel'
                          )}
                        >
                          <span className="text-xl">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-och-steel/20 relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-och-defender/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-och-defender flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.first_name?.[0] || user?.email?.[0] || 'D'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || (user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : 'Director')}
              </p>
              <p className="text-xs text-och-mint truncate mt-0.5">
                {roleDisplayName}
              </p>
            </div>
            <svg
              className={`w-4 h-4 text-och-steel transition-transform flex-shrink-0 ${isProfileOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <Link
                  href="/dashboard/director/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 text-sm text-och-steel hover:bg-och-defender/20 hover:text-och-mint transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-och-orange hover:bg-och-orange/20 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Desktop: Add margin to content when sidebar is visible */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}

