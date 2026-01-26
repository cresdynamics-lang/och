'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  // Redirect to role-based login page
  useEffect(() => {
    router.replace('/login/student')
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center">
      <div className="text-och-steel">Redirecting to login...</div>
    </div>
  )
}

