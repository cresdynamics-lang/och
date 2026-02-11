'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MentorDashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect from old /mentor/dashboard to new /dashboard/mentor
    router.replace('/dashboard/mentor')
  }, [router])

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center">
      <div className="text-och-steel">Redirecting to mentor dashboard...</div>
    </div>
  )
}
