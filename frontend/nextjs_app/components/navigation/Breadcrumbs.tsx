'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getDashboardContextFromPath } from '@/utils/navigation'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

// Auto-generate breadcrumbs from pathname if items not provided
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Get the dashboard context from the pathname
  const dashboardContext = getDashboardContextFromPath(pathname)
  const dashboardBase = dashboardContext || '/dashboard/student'

  // Determine dashboard label based on context
  const dashboardLabelMap: Record<string, string> = {
    '/dashboard/student': 'Student Dashboard',
    '/dashboard/mentor': 'Mentor Dashboard',
    '/dashboard/admin': 'Admin Dashboard',
    '/dashboard/director': 'Director Dashboard',
    '/dashboard/sponsor': 'Sponsor Dashboard',
    '/dashboard/analyst': 'Analyst Dashboard',
    '/dashboard/employer': 'Employer Dashboard',
  }

  const dashboardLabel = dashboardLabelMap[dashboardBase] || 'Dashboard'
  breadcrumbs.push({ label: dashboardLabel, href: dashboardBase })

  // Map path segments to readable labels
  const labelMap: Record<string, string> = {
    student: 'Student',
    mentor: 'Mentor',
    admin: 'Admin',
    director: 'Director',
    sponsor: 'Sponsor',
    analyst: 'Analyst',
    employer: 'Employer',
    missions: 'Missions',
    coaching: 'Coaching',
    curriculum: 'Curriculum',
    portfolio: 'Portfolio',
    community: 'Community',
    mentorship: 'Mentorship',
    settings: 'Settings',
    profile: 'Profile',
    mentees: 'Mentees',
    sessions: 'Sessions',
    analytics: 'Analytics',
    cohorts: 'Cohorts',
    tracks: 'Tracks',
  }

  let currentPath = dashboardBase
  
  segments.forEach((segment, index) => {
    // Skip 'dashboard' segment
    if (segment === 'dashboard') {
      return
    }

    // Skip role segment (student, mentor, etc.) if it's the first segment after dashboard
    if (index === 1 && ['student', 'mentor', 'admin', 'director', 'sponsor', 'analyst', 'employer'].includes(segment)) {
      return
    }

    currentPath += `/${segment}`
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href: currentPath })
  })

  return breadcrumbs
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()
  const breadcrumbs = items || generateBreadcrumbs(pathname || '')

  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-och-steel"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {isLast ? (
              <span className="text-och-mint font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-och-steel hover:text-och-mint transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

