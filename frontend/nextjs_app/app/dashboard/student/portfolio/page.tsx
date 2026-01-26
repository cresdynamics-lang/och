'use client'

/**
 * Student Dashboard Portfolio Page
 * Redirects to main portfolio dashboard for unified experience
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PortfolioDashboard } from '@/components/ui/portfolio/PortfolioDashboard'

export default function PortfolioPage() {
  return (
      <div className="min-h-screen">
        <PortfolioDashboard />
      </div>
  )
}

