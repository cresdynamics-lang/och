'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

interface SidebarItem {
  id: string
  label: string
  icon: string
  href?: string
  onClick?: () => void
}

type ViewType = 'dashboard' | 'create-program' | 'view-programs' | 'cohorts' | 'analytics'

interface DirectorSidebarProps {
  activeView: string
  onViewChange: (view: ViewType) => void
}

export function DirectorSidebar({ activeView, onViewChange }: DirectorSidebarProps) {
  const pathname = usePathname()

  const menuItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      onClick: () => onViewChange('dashboard'),
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: '🔔',
      href: '/dashboard/director/inbox',
    },
    {
      id: 'view-programs',
      label: 'Programs',
      icon: '📋',
      onClick: () => onViewChange('view-programs'),
    },
    {
      id: 'create-program',
      label: 'Create Program',
      icon: '➕',
      onClick: () => onViewChange('create-program'),
    },
    {
      id: 'cohorts',
      label: 'Cohorts',
      icon: '📅',
      onClick: () => onViewChange('cohorts'),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      onClick: () => onViewChange('analytics'),
    },
    {
      id: 'mentors',
      label: 'Mentors',
      icon: '👥',
      href: '/dashboard/director/mentors',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      href: '/dashboard/director/settings',
    },
  ]

  return (
    <div className="w-64 bg-och-midnight border-r border-och-steel/20 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-och-steel/20">
        <h2 className="text-xl font-bold text-och-mint mb-1">Director Hub</h2>
        <p className="text-xs text-och-steel">Command Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeView === item.id || (item.href && pathname === item.href)
          
          const content = (
            <div
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer',
                isActive
                  ? 'bg-och-defender text-white shadow-lg shadow-och-defender/20'
                  : 'text-och-steel hover:bg-och-midnight/50 hover:text-white'
              )}
              onClick={() => item.onClick && item.onClick()}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
          )

          if (item.href) {
            return (
              <Link key={item.id} href={item.href}>
                {content}
              </Link>
            )
          }

          return <div key={item.id}>{content}</div>
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-och-steel/20">
        <div className="text-xs text-och-steel text-center">
          OCH Cyber Talent Engine
        </div>
      </div>
    </div>
  )
}

