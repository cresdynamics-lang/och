'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

interface NotificationCount {
  unread: number
  critical: number
}

export function DirectorHeader() {
  const pathname = usePathname()
  const [notificationCount, setNotificationCount] = useState<NotificationCount>({ unread: 0, critical: 0 })
  const [mailCount, setMailCount] = useState(0)

  useEffect(() => {
    // TODO: Replace with actual API calls
    // For now, using mock data
    const loadCounts = async () => {
      // Mock notification count
      setNotificationCount({ unread: 3, critical: 1 })
      // Mock mail count
      setMailCount(5)
    }

    loadCounts()
    // Refresh counts periodically
    const interval = setInterval(loadCounts, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const isInboxPage = pathname?.includes('/inbox')
  const isNotificationsPage = pathname?.includes('/notifications')
  
  return (
    <header className="sticky top-0 z-30 bg-och-midnight/95 backdrop-blur-sm border-b border-och-steel/20">
      <div className="flex items-center justify-end gap-4 px-4 py-3 lg:px-6">
        {/* Notifications Button */}
        <Link
          href="/dashboard/director/notifications"
          className={`relative p-2 rounded-lg transition-all ${
            isNotificationsPage
              ? 'bg-och-defender/30 text-och-mint'
              : 'text-och-steel hover:bg-och-defender/20 hover:text-och-mint'
          }`}
          title="Notifications"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {notificationCount.unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-och-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
              {notificationCount.unread > 99 ? '99+' : notificationCount.unread}
            </span>
          )}
          {notificationCount.critical > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-och-orange rounded-full animate-pulse" />
          )}
          </Link>
          
        {/* Mail/Inbox Button */}
        <Link
          href="/dashboard/director/inbox"
          className={`relative p-2 rounded-lg transition-all ${
            isInboxPage
              ? 'bg-och-defender/30 text-och-mint'
              : 'text-och-steel hover:bg-och-defender/20 hover:text-och-mint'
          }`}
          title="Inbox"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {mailCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-och-mint text-och-midnight text-xs font-bold rounded-full flex items-center justify-center">
              {mailCount > 99 ? '99+' : mailCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
