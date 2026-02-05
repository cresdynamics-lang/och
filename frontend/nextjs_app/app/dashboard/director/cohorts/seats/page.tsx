'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SeatsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/director/enrollment/seats')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender"></div>
    </div>
  )
}