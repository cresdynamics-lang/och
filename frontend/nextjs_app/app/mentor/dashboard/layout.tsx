'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function MentorDashboardRedirectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Redirect from old /mentor/dashboard/* to new /dashboard/mentor/*
    if (pathname.startsWith('/mentor/dashboard')) {
      const newPath = pathname.replace('/mentor/dashboard', '/dashboard/mentor')
      router.replace(newPath)
    }
  }, [pathname, router])

  // Show loading state while redirecting
  if (pathname.startsWith('/mentor/dashboard')) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-och-steel">Redirecting to mentor dashboard...</div>
      </div>
    )
  }

  return <>{children}</>
}
