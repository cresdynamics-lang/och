/**
 * Fallback component for Mission Dashboard Kanban
 * Shows when there's an error or no data
 */
'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface MissionDashboardKanbanFallbackProps {
  error?: Error | string | null
  onRetry?: () => void
}

export function MissionDashboardKanbanFallback({ error, onRetry }: MissionDashboardKanbanFallbackProps) {
  return (
    <div className="p-6">
      <Card className="p-6 text-center border-och-error/30">
        <h3 className="text-lg font-bold text-och-error mb-2">Mission Dashboard Unavailable</h3>
        {error && (
          <p className="text-och-steel mb-4 text-sm">
            {typeof error === 'string' ? error : error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}
        <div className="space-y-2">
          <Button variant="defender" onClick={onRetry || (() => window.location.reload())}>
            Retry
          </Button>
          <p className="text-xs text-och-steel mt-4">
            If this persists, check your network connection and try refreshing the page.
          </p>
        </div>
      </Card>
    </div>
  )
}

