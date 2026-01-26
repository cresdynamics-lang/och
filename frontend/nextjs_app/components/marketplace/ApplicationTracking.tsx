'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useJobApplications } from '@/hooks/useMarketplace'
import { useAuth } from '@/hooks/useAuth'

export function ApplicationTracking() {
  const { user } = useAuth()
  const menteeId = user?.id?.toString()
  const { applications, isLoading } = useJobApplications()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'defender'
      case 'under_review':
        return 'mint'
      case 'interview':
        return 'gold'
      case 'offer':
        return 'mint'
      case 'rejected':
        return 'orange'
      default:
        return 'steel'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return '📤'
      case 'under_review':
        return '👀'
      case 'interview':
        return '🤝'
      case 'offer':
        return '🎉'
      case 'rejected':
        return '❌'
      default:
        return '📝'
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-och-steel">Loading applications...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-xl font-bold mb-4 text-white">My Applications</h3>
        {applications.length === 0 ? (
          <div className="text-center text-och-steel py-8">
            <div className="text-4xl mb-2">📋</div>
            <div>No applications yet</div>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-och-midnight/50 rounded-lg border-l-4 border-och-defender"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStatusIcon(app.status)}</span>
                    <div>
                      <div className="font-semibold text-white">Application #{app.id.slice(0, 8)}</div>
                      <div className="text-xs text-och-steel">
                        {app.applied_at
                          ? `Submitted: ${new Date(app.applied_at).toLocaleDateString()}`
                          : 'Draft'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(app.status) as any} className="capitalize">
                    {app.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

