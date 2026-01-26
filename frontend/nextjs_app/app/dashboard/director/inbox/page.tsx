'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import type { NotificationItem } from '@/components/dashboard/NotificationBell'
import Link from 'next/link'

export default function DirectorInboxPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API endpoint when available
      const mockNotifications: NotificationItem[] = [
        {
          id: '1',
          type: 'alert',
          title: 'Cohort Capacity Warning',
          message: 'Cohort "Cybersecurity Fundamentals" is 90% full and approaching capacity. Consider opening a new cohort or expanding capacity.',
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
          actionUrl: '/dashboard/director',
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
        {
          id: '6',
          type: 'notification',
          title: 'Portfolio Review Complete',
          message: 'Portfolio reviews completed for 8 students in Cohort C',
          priority: 'low',
          timestamp: new Date(Date.now() - 21600000).toISOString(),
          read: true,
          category: 'portfolio',
        },
        {
          id: '7',
          type: 'reminder',
          title: 'Mission Deadline Approaching',
          message: 'Mission submission deadline in 2 days for 12 students',
          priority: 'high',
          timestamp: new Date(Date.now() - 25200000).toISOString(),
          read: false,
          category: 'missions',
          actionUrl: '/dashboard/director',
        },
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
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

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-och-orange'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-och-gold'
      case 'low':
        return 'bg-och-defender'
      default:
        return 'bg-och-steel'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'orange'
      case 'high':
        return 'orange'
      case 'medium':
        return 'gold'
      case 'low':
        return 'defender'
      default:
        return 'steel'
    }
  }

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'cohort':
        return '👥'
      case 'payment':
        return '💳'
      case 'enrollment':
        return '📝'
      case 'mentorship':
        return '🤝'
      case 'portfolio':
        return '📁'
      case 'missions':
        return '🎯'
      default:
        return '📬'
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

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread' && n.read) return false
      if (filter !== 'all' && filter !== 'unread' && n.priority !== filter) return false
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false
      return true
    })
  }, [notifications, filter, categoryFilter])

  // Sort by priority and timestamp
  const sortedNotifications = useMemo(() => {
    return [...filteredNotifications].sort((a, b) => {
      // Unread first
      if (a.read !== b.read) return a.read ? 1 : -1
      // Then by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      // Then by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [filteredNotifications])

  // Group by time
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: NotificationItem[] } = {}
    const now = new Date()
    
    sortedNotifications.forEach((notification) => {
      const time = new Date(notification.timestamp)
      const diffInHours = (now.getTime() - time.getTime()) / (1000 * 60 * 60)
      
      let groupKey: string
      if (diffInHours < 24) {
        groupKey = 'Today'
      } else if (diffInHours < 48) {
        groupKey = 'Yesterday'
      } else if (diffInHours < 168) {
        groupKey = 'This Week'
      } else {
        groupKey = time.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })
    
    return groups
  }, [sortedNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length
  const criticalCount = notifications.filter((n) => n.priority === 'critical' && !n.read).length
  const highCount = notifications.filter((n) => n.priority === 'high' && !n.read).length

  const categories = Array.from(new Set(notifications.map((n) => n.category).filter((cat): cat is string => Boolean(cat))))

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Inbox</h1>
                <p className="text-och-steel">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
          </div>

            {/* Priority Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pt-2 scrollbar-hide">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-och-defender/20 text-och-defender border border-och-defender/40'
                    : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-och-steel/20'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? 'bg-och-defender/20 text-och-defender border border-och-defender/40'
                      : 'bg-och-midnight/50 text-och-steel hover:bg-och-midnight border border-och-steel/20'
                  }`}
                >
                  {getCategoryIcon(cat)} {cat}
                </button>
              ))}
            </div>
          )}
      </div>

      {/* Feed Content */}
          <div className="py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-4">
                  <div className="h-4 bg-och-steel/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-och-steel/20 rounded w-full mb-2"></div>
                  <div className="h-3 bg-och-steel/20 rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : sortedNotifications.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
            <p className="text-och-steel">You're all caught up!</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
              <div key={groupKey}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-och-steel uppercase tracking-wider">
                    {groupKey}
                  </h2>
                  <div className="flex-1 h-px bg-och-steel/20"></div>
                  <span className="text-xs text-och-steel">{groupNotifications.length}</span>
                </div>
                <div className="space-y-3">
                  {groupNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`${getPriorityColor(notification.priority)} ${
                        !notification.read
                          ? 'bg-och-midnight/50 hover:bg-och-midnight/70'
                          : 'bg-och-midnight/30 opacity-75 hover:opacity-100'
                      } transition-all duration-200 cursor-pointer group`}
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
                          {/* Category Icon */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-och-defender/20 flex items-center justify-center text-xl">
                            {getCategoryIcon(notification.category)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-sm truncate">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityDot(
                                      notification.priority
                                    )}`}
                                  />
                                )}
                              </div>
                              <Badge
                                variant={getPriorityBadgeColor(notification.priority) as any}
                                className="text-xs flex-shrink-0"
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-och-steel mb-2 line-clamp-2">
                              {notification.message}
                            </p>
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
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      </DirectorLayout>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </RouteGuard>
  )
}
