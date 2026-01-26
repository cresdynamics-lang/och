'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'alert' | 'reminder' | 'notification' | 'success' | 'warning' | 'error'
  title: string
  message: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  timestamp: string
  read: boolean
  category?: string
  actionUrl?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API endpoint
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'alert',
          title: 'Cohort Capacity Warning',
          message: 'Cohort "Cybersecurity Fundamentals" is 90% full and approaching capacity.',
          priority: 'critical',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          category: 'cohort',
          actionUrl: '/dashboard/director/cohorts',
        },
        {
          id: '2',
          type: 'reminder',
          title: 'Payment Due Soon',
          message: '3 payments are due in the next 7 days. Total amount: $15,000',
          priority: 'high',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: false,
          category: 'payment',
          actionUrl: '/dashboard/director/analytics',
        },
        {
          id: '3',
          type: 'notification',
          title: 'New Enrollment Request',
          message: '5 new enrollment requests pending review for Cohort A',
          priority: 'medium',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          read: false,
          category: 'enrollment',
          actionUrl: '/dashboard/director/enrollment',
        },
        {
          id: '4',
          type: 'reminder',
          title: 'Mentor Session Scheduled',
          message: 'Mentor session scheduled for tomorrow at 2 PM with Cohort B',
          priority: 'low',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          read: true,
          category: 'mentorship',
        },
        {
          id: '5',
          type: 'alert',
          title: 'Mentor Over Capacity',
          message: 'Mentor John Doe is assigned to 15 mentees, exceeding recommended capacity of 12',
          priority: 'critical',
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          read: false,
          category: 'mentorship',
          actionUrl: '/dashboard/director/mentors',
        },
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread' && n.read) return false
      if (filter !== 'all' && filter !== 'unread' && n.priority !== filter) return false
      return true
    })
  }, [notifications, filter])

  const sortedNotifications = useMemo(() => {
    return [...filteredNotifications].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [filteredNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length
  const criticalCount = notifications.filter((n) => n.priority === 'critical' && !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'alert':
        return '🚨'
      case 'reminder':
        return '⏰'
      default:
        return 'ℹ️'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-och-orange'
      case 'high':
        return 'border-l-4 border-orange-500'
      case 'medium':
        return 'border-l-4 border-och-gold'
      case 'low':
        return 'border-l-4 border-och-defender'
      default:
        return 'border-l-4 border-och-steel'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return time.toLocaleDateString()
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Notifications</h1>
                <p className="text-och-steel">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-och-defender text-white'
                    : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-och-steel/20'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
                  filter === 'unread'
                    ? 'bg-och-mint text-och-midnight'
                    : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-och-steel/20'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-och-orange rounded-full text-xs flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
                  filter === 'critical'
                    ? 'bg-och-orange text-white'
                    : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-och-orange/40'
                }`}
              >
                Critical
                {criticalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full text-xs flex items-center justify-center text-och-orange">
                    {criticalCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('high')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'high'
                    ? 'bg-orange-500 text-white'
                    : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-orange-500/40'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setFilter('medium')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'medium'
                    ? 'bg-och-gold text-och-midnight'
                    : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-och-gold/40'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFilter('low')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === 'low'
                    ? 'bg-och-defender text-white'
                    : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-och-defender/40'
                }`}
              >
                Low
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="p-4">
                    <div className="h-4 bg-och-steel/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-och-steel/20 rounded w-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedNotifications.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
              <p className="text-och-steel">You're all caught up!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`${getPriorityColor(notification.priority)} ${
                        !notification.read
                          ? 'bg-och-midnight/50 hover:bg-och-midnight/70'
                          : 'bg-och-midnight/30 opacity-75 hover:opacity-100'
                      } transition-all duration-200 cursor-pointer`}
                    >
                      <div
                        className="p-4"
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id)
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl
                          }
                        }}
                      >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-och-defender/20 flex items-center justify-center text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm truncate">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-och-mint rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <Badge
                            variant={
                              notification.priority === 'critical' || notification.priority === 'high'
                                ? 'orange'
                                : notification.priority === 'medium'
                                ? 'gold'
                                : 'defender'
                            }
                            className="text-xs flex-shrink-0"
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-och-steel mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-och-steel">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-och-mint hover:text-och-mint/80 font-medium"
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}


