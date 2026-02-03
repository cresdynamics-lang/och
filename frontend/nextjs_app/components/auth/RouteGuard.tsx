'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { hasRouteAccess } from '@/utils/rbac'
import { getRedirectRoute } from '@/utils/redirect'
import { getUserRoles } from '@/utils/rbac'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function RouteGuard({ children, requiredRoles: _requiredRoles }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)

  // Prevent hydration mismatch by ensuring consistent server/client rendering
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const getLoginRouteForPath = (path: string) => {
    if (path.startsWith('/dashboard/director')) return '/login/director'
    if (path.startsWith('/dashboard/admin')) return '/login/admin'
    if (path.startsWith('/mentor/dashboard')) return '/login/mentor'
    if (path.startsWith('/dashboard/sponsor')) return '/login/sponsor'
    if (path.startsWith('/dashboard/analyst') || path.startsWith('/dashboard/analytics')) return '/login/analyst'
    if (path.startsWith('/dashboard/employer') || path.startsWith('/dashboard/marketplace')) return '/login/employer'
    if (path.startsWith('/dashboard/finance') || path.startsWith('/finance/')) return '/login/finance'
    return '/login/student'
  }

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) return

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

    // For student dashboard routes, be much more lenient
    const isStudentRoute = currentPath.startsWith('/dashboard/student')

    if (isStudentRoute) {
      // For student routes, if there's any token at all, allow access
      // The middleware will handle proper RBAC server-side
      const hasToken = typeof window !== 'undefined' && (
        localStorage.getItem('access_token') ||
        document.cookie.includes('access_token=')
      )

      if (hasToken) {
        console.log('RouteGuard: Student route with token - allowing access, middleware will handle RBAC')
        return // Allow access, let middleware handle it
      } else {
        console.log('RouteGuard: Student route without token - redirecting to login')
        const loginRoute = getLoginRouteForPath(currentPath)
        const redirectUrl = `${loginRoute}?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
        return
      }
    }

    // For non-student routes, use normal logic
    if (!isAuthenticated || !user) {
      const hasToken = typeof window !== 'undefined' && (
        localStorage.getItem('access_token') ||
        document.cookie.includes('access_token=')
      )

      if (!hasToken) {
        console.log('RouteGuard: No auth token found for non-student route, redirecting to login')
        const loginRoute = getLoginRouteForPath(currentPath)
        if (typeof window !== 'undefined') {
          const redirectUrl = `${loginRoute}?redirect=${encodeURIComponent(currentPath)}`
          router.push(redirectUrl)
        }
        return
      }
      // Token exists but user not loaded - wait briefly
      console.log('RouteGuard: Token exists but user not loaded, waiting...')
      return
    }

    // If requiredRoles is provided, enforce it (in addition to route permissions)
    if (_requiredRoles && _requiredRoles.length > 0) {
      const roles = getUserRoles(user)
      const ok = _requiredRoles.some(r => roles.includes(r as any))
      if (!ok) {
        router.push(getRedirectRoute(user))
        return
      }
    }

    if (!hasRouteAccess(user, currentPath)) {
      router.push(getRedirectRoute(user))
      return
    }
  }, [user, isLoading, isAuthenticated, router])

  // Prevent hydration mismatch - always show loading on server and until hydrated
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-och-steel animate-pulse">Loading OCH Dashboard...</div>
      </div>
    )
  }

  // If not authenticated but token exists, show loading (auth state might be updating)
  if (!isAuthenticated || !user) {
    const hasToken = typeof window !== 'undefined' && (
      localStorage.getItem('access_token') ||
      document.cookie.includes('access_token=')
    )

    if (hasToken) {
      // Token exists but user not loaded - show loading
      return (
        <div className="min-h-screen bg-och-midnight flex items-center justify-center">
          <div className="text-och-steel animate-pulse">Authenticating...</div>
        </div>
      )
    }

    return null
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

  if (_requiredRoles && _requiredRoles.length > 0) {
    const roles = getUserRoles(user)
    const ok = _requiredRoles.some(r => roles.includes(r as any))
    if (!ok) return null
  }

  if (!hasRouteAccess(user, currentPath)) return null

  return <>{children}</>
}

