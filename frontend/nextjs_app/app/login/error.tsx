'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Login page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/70 backdrop-blur-xl rounded-lg border border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Login Error</h2>
        <p className="text-slate-400 mb-6">
          {error.message || 'Failed to load login page'}
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
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex-1"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

