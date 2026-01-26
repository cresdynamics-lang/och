'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'
import Link from 'next/link'

export interface NotificationItem {
  id: string
  type: 'notification' | 'reminder' | 'alert'
  title: string
  message: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  timestamp: string
  read: boolean
  actionUrl?: string
  category?: string
}

interface NotificationBellProps {
  userId?: string | number
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      // Fetch real notifications from API
      try {
        const response = await apiGateway.get<any>('/notifications', {
          params: { user_id: userId }
        })
        const fetchedNotifications = Array.isArray(response) ? response : (response?.results || [])
        setNotifications(fetchedNotifications)
        setUnreadCount(fetchedNotifications.filter((n) => !n.read).length)
      } catch (error) {
        // If API endpoint doesn't exist yet, return empty array
        console.debug('Notifications API not available:', error)
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-och-orange text-white border-och-orange'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      case 'medium':
        return 'bg-och-gold/20 text-och-gold border-och-gold/40'
      case 'low':
        return 'bg-och-defender/20 text-och-defender border-och-defender/40'
      default:
        return 'bg-och-steel/20 text-och-steel border-och-steel/40'
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

  const markAsRead = async (id: string) => {
    try {
      // Update locally first for immediate feedback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      
      // Call API to mark as read
      try {
        await apiGateway.patch(`/notifications/${id}/read`)
      } catch (error) {
        console.debug('Mark as read API not available:', error)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Sort notifications by priority and timestamp
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const unreadNotifications = sortedNotifications.filter((n) => !n.read)

  return (
    <div className="relative">
      <Link href="/dashboard/director/inbox">
        <button
          className="relative p-2 text-och-steel hover:text-white transition-colors"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="Notifications"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-och-orange rounded-full border-2 border-och-midnight">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Link>

      {/* Dropdown Preview (optional - shows on hover/click) */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-och-midnight border border-och-steel/20 rounded-lg shadow-xl z-20 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-och-steel/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <Link
                href="/dashboard/director/inbox"
                className="text-sm text-och-mint hover:text-och-mint/80"
              >
                View All
              </Link>
            </div>
            <div className="overflow-y-auto max-h-80">
              {isLoading ? (
                <div className="p-4 text-center text-och-steel">Loading...</div>
              ) : unreadNotifications.length === 0 ? (
                <div className="p-4 text-center text-och-steel">
                  No unread notifications
                </div>
              ) : (
                <div className="divide-y divide-och-steel/10">
                  {unreadNotifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-och-midnight/50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-och-defender/5' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityColor(
                            notification.priority
                          ).split(' ')[0]}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white text-sm truncate">
                              {notification.title}
                            </p>
                            <Badge
                              variant={getPriorityBadgeColor(
                                notification.priority
                              ) as any}
                              className="text-xs flex-shrink-0"
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-och-steel line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-och-steel mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}






