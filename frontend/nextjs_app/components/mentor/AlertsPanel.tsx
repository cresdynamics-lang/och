'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useMentorAlerts } from '@/hooks/useMentorAlerts'
import { useAuth } from '@/hooks/useAuth'

export function AlertsPanel() {
  const { user } = useAuth()
  const mentorId = user?.id?.toString()
  const { alerts, isLoading, error } = useMentorAlerts(mentorId)

  const severityVariant = (severity: string) => {
    if (severity === 'critical') return 'orange'
    if (severity === 'high') return 'gold'
    if (severity === 'medium') return 'defender'
    return 'mint'
  }

  return (
    <Card className="mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Alerts & Flags</h2>

      {isLoading && (
        <div className="text-och-steel text-sm">Loading alerts...</div>
      )}

      {error && !isLoading && (
        <div className="text-och-orange text-sm">Error loading alerts: {error}</div>
      )}

      {!isLoading && !error && alerts.length === 0 && (
        <div className="text-och-steel text-sm">No active alerts.</div>
      )}

      {!isLoading && !error && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="p-3 bg-och-midnight/50 rounded-lg flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={severityVariant(a.severity) as any} className="text-[11px] capitalize">
                    {a.severity}
                  </Badge>
                  <span className="text-sm text-white">{a.type}</span>
                </div>
                <span className="text-[11px] text-och-steel">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-och-steel">
                {a.description}{' '}
                {a.mentee_name && (
                  <span className="font-semibold text-och-mint">
                    ({a.mentee_name})
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-1">
                <Button variant="outline" size="sm">
                  Contact Mentee
                </Button>
                <Button variant="outline" size="sm">
                  Flag to Program Director
                </Button>
                <Button variant="defender" size="sm">
                  Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


