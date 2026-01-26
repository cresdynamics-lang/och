'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function EmployerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Employer dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-och-slate-800 rounded-lg border border-och-slate-700 p-6">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Employer Dashboard Error</h2>
        <p className="text-och-steel mb-4">
          {error.message || 'Failed to load employer dashboard'}
        </p>
        <div className="flex gap-4">
          <Button
            onClick={reset}
            variant="defender"
            className="flex-1"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

