'use client'

import { useEffect } from 'react'

export default function SponsorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Sponsor dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-och-slate-800 rounded-lg border border-och-slate-700 p-6">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Sponsor Dashboard Error</h2>
        <p className="text-och-steel mb-4">
          {error.message || 'Failed to load sponsor dashboard'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-och-slate-700 text-och-steel rounded-lg hover:bg-och-slate-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

