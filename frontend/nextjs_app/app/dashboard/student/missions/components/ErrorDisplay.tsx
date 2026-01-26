/**
 * Error Display Component
 * Shows error messages clearly
 */
'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ErrorDisplayProps {
  error: Error | string | unknown
  title?: string
  onRetry?: () => void
}

export function ErrorDisplay({ error, title = 'Error', onRetry }: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  return (
    <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-6">
      <Card className="p-8 max-w-2xl w-full border-och-error/30">
        <h1 className="text-2xl font-bold text-och-error mb-4">{title}</h1>
        <div className="bg-och-midnight/50 p-4 rounded-lg mb-4">
          <p className="text-white font-mono text-sm whitespace-pre-wrap break-words">
            {errorMessage}
          </p>
          {errorStack && (
            <details className="mt-4">
              <summary className="text-och-steel cursor-pointer text-sm">Stack Trace</summary>
              <pre className="text-xs text-och-steel mt-2 overflow-auto max-h-60">
                {errorStack}
              </pre>
            </details>
          )}
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <Button variant="defender" onClick={onRetry}>
              Retry
            </Button>
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </Card>
    </div>
  )
}

