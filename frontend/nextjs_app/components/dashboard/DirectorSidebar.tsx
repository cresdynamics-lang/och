'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { 
  LayoutDashboard, 
  Bell, 
  BookOpen, 
  Plus, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings 
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
}

type ViewType = 'dashboard' | 'view-programs' | 'cohorts' | 'analytics'

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
      icon: LayoutDashboard,
      onClick: () => onViewChange('dashboard'),
    },
    {
      id: 'inbox',
      label: 'Notifications',
      icon: Bell,
      href: '/dashboard/director/inbox',
    },
    {
      id: 'view-programs',
      label: 'Programs',
      icon: BookOpen,
      onClick: () => onViewChange('view-programs'),
    },
    {
      id: 'cohorts',
      label: 'Cohorts',
      icon: Calendar,
      onClick: () => onViewChange('cohorts'),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => onViewChange('analytics'),
    },
    {
      id: 'mentors',
      label: 'Mentors',
      icon: Users,
      href: '/dashboard/director/mentors',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/director/settings',
    },
  ]

  return (
    <div className="w-64 bg-och-midnight border-r border-och-steel/20 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-och-steel/20">
        <h2 className="text-xl font-bold text-white mb-1">Director Hub</h2>
        <p className="text-sm text-och-steel">Program Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeView === item.id || (item.href && pathname === item.href)
          const IconComponent = item.icon
          
          const content = (
            <div
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer group',
                isActive
                  ? 'bg-och-defender text-white shadow-sm'
                  : 'text-och-steel hover:bg-och-steel/10 hover:text-white'
              )}
              onClick={() => item.onClick && item.onClick()}
            >
              <IconComponent className={clsx(
                'w-5 h-5 transition-colors',
                isActive ? 'text-white' : 'text-och-steel group-hover:text-white'
              )} />
              <span className="font-medium text-sm">{item.label}</span>
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
          OCH Director Portal
        </div>
      </div>
    </div>
  )
}

