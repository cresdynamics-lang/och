'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getRedirectRoute } from '@/utils/redirect'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) return
    
    if (!isLoading) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Check if token exists (might be a timing issue after login)
        const hasToken = typeof window !== 'undefined' && (
          localStorage.getItem('access_token') || 
          document.cookie.includes('access_token=')
        )
        
        if (!hasToken) {
          // No token - middleware should have handled this, but just in case
          hasRedirectedRef.current = true
          router.push('/login/student')
          return
        } else {
          // Token exists but user not loaded yet - wait
          return
        }
      }

      // User is authenticated - redirect to appropriate dashboard
      if (user) {
        hasRedirectedRef.current = true
        
        // CRITICAL: Check for admin role first
        const userRoles = user.roles || []
        const isAdmin = userRoles.some((ur: any) => {
          const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
          return roleName?.toLowerCase().trim() === 'admin'
        })
        
        let dashboardRoute = '/dashboard/student'
        
        if (isAdmin) {
          console.log('✅ Admin user detected - redirecting to /dashboard/admin')
          dashboardRoute = '/dashboard/admin'
        } else {
          // Use centralized redirect utility for other roles
          dashboardRoute = getRedirectRoute(user)
          console.log('📍 Dashboard redirect (non-admin):', dashboardRoute)
        }
        
        router.push(dashboardRoute)
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-och-steel">Loading...</div>
      </div>
    )
  }

  return null
}

