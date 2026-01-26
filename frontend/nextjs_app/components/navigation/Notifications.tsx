'use client'

import { useState, useRef, useEffect } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
}

// Mock notifications - replace with real data from API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Mentor Message',
    message: 'Your mentor has sent you feedback on your latest assignment',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: '2',
    title: 'Mission Deadline',
    message: 'Mission "Cybersecurity Fundamentals" is due in 3 days',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: '3',
    title: 'Community Alert',
    message: 'New discussion started in your group',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
  },
]

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-och-defender/20 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-och-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-och-orange text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-och-midnight border border-och-steel/20 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-och-steel/20 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-och-mint hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-och-steel text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-och-steel/20">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-och-defender/10 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-och-defender/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-och-mint rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-och-steel mt-1">{notification.message}</p>
                        <p className="text-xs text-och-steel/70 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t border-och-steel/20">
              <button className="w-full text-center text-sm text-och-mint hover:underline py-2">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

