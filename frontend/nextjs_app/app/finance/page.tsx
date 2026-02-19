'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FinancePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new finance dashboard location
    router.replace('/dashboard/finance')
  }, [router])
  
  return null
}
