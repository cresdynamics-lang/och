'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { DirectorAlert } from '@/services/programsClient'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error' | 'alert' | 'request' | 'review'
  title: string
  message: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
  timestamp: string
  actionUrl?: string
  onAction?: () => void
}

interface ActionCenterProps {
  notifications?: Notification[]
  pendingRequests?: Array<{
    id: string
    type: 'enrollment' | 'mentor_assignment' | 'cohort_placement'
    title: string
    description: string
    cohortName?: string
    userName?: string
    timestamp: string
    onApprove?: () => void
    onReject?: () => void
  }>
  reviews?: Array<{
    id: string
    type: 'cohort_placement' | 'enrollment_review'
    title: string
    description: string
    cohortName: string
    count: number
    timestamp: string
    onReview?: () => void
  }>
  alerts?: DirectorAlert[]
}

export function ActionCenter({
  notifications = [],
  pendingRequests = [],
  reviews = [],
  alerts = [],
}: ActionCenterProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'border-och-orange bg-och-orange/10'
      case 'high':
        return 'border-och-orange bg-och-orange/5'
      case 'medium':
        return 'border-och-gold bg-och-gold/5'
      default:
        return 'border-och-defender bg-och-defender/5'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cohort_at_risk':
        return '⚠️'
      case 'underfilled_cohort':
        return '📉'
      case 'overfilled_cohort':
        return '📊'
      case 'payment_anomaly':
        return '💳'
      case 'mentor_sla_breach':
        return '👥'
      case 'enrollment':
        return '📝'
      case 'mentor_assignment':
        return '👤'
      case 'cohort_placement':
        return '📍'
      case 'info':
        return 'ℹ️'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '🔔'
    }
  }

  const totalItems = notifications.length + pendingRequests.length + reviews.length + alerts.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Action Center</h2>
        {totalItems > 0 && (
          <Badge variant="orange" className="animate-pulse">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Badge>
        )}
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card className="border-och-orange/50">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>⚠️</span>
            Critical Alerts
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getTypeIcon(alert.type)}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{alert.title}</p>
                    <p className="text-sm text-och-steel mt-1">{alert.message}</p>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'orange' : 'defender'}>
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>📋</span>
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 bg-och-midnight/50 rounded-lg border border-och-steel/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getTypeIcon(request.type)}</span>
                      <p className="font-semibold text-white">{request.title}</p>
                    </div>
                    <p className="text-sm text-och-steel">{request.description}</p>
                    {request.cohortName && (
                      <p className="text-xs text-och-mint mt-1">
                        Cohort: {request.cohortName}
                      </p>
                    )}
                    {request.userName && (
                      <p className="text-xs text-och-mint mt-1">User: {request.userName}</p>
                    )}
                    <p className="text-xs text-och-steel mt-2">
                      {new Date(request.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {request.onApprove && (
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={request.onApprove}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                  )}
                  {request.onReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={request.onReject}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews Needed */}
      {reviews.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>🔍</span>
            Reviews Needed ({reviews.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 bg-och-midnight/50 rounded-lg border border-och-defender/30 hover:border-och-defender/50 transition-colors cursor-pointer"
                onClick={review.onReview}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getTypeIcon(review.type)}</span>
                      <p className="font-semibold text-white">{review.title}</p>
                      <Badge variant="defender">{review.count}</Badge>
                    </div>
                    <p className="text-sm text-och-steel">{review.description}</p>
                    <p className="text-xs text-och-mint mt-1">
                      Cohort: {review.cohortName}
                    </p>
                    <p className="text-xs text-och-steel mt-2">
                      {new Date(review.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {review.onReview && (
                    <Button variant="defender" size="sm" onClick={review.onReview}>
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🔔</span>
              Notifications ({notifications.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Mark all as read
                notifications.forEach((n) => n.onAction?.())
              }}
            >
              Mark all read
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${getSeverityColor(notification.severity)} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={notification.onAction}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getTypeIcon(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{notification.title}</p>
                      {notification.severity && (
                        <Badge
                          variant={
                            notification.severity === 'critical'
                              ? 'orange'
                              : notification.severity === 'high'
                              ? 'orange'
                              : 'defender'
                          }
                          className="text-xs"
                        >
                          {notification.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-och-steel mt-1">{notification.message}</p>
                    <p className="text-xs text-och-steel mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-och-steel">All clear! No pending actions.</p>
          </div>
        </Card>
      )}
    </div>
  )
}



