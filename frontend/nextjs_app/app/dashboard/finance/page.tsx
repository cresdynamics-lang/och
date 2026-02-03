'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function FinanceRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to the OCH Finance Dashboard
    // Use finance-user as default for demo purposes
    router.replace(`/finance/finance-user/dashboard`)
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-cyan-400 animate-pulse">Redirecting to OCH Finance Dashboard...</div>
    </div>
  )
}

export default function FinanceDashboard() {
  return <FinanceRedirect />
}

