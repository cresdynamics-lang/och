'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  MessageSquare,
  Target,
  Award,
  Users,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  ExternalLink,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  Reply,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { NotificationItem } from '@/lib/control-center';

interface NotificationsFeedProps {
  notifications: NotificationItem[];
  onRefresh?: () => void;
}

export function NotificationsFeed({ notifications, onRefresh }: NotificationsFeedProps) {
  const [displayedNotifications, setDisplayedNotifications] = useState<NotificationItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Initialize with first batch of notifications
  useEffect(() => {
    setDisplayedNotifications(notifications.slice(0, 10));
    setHasMore(notifications.length > 10);
  }, [notifications]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Simulate loading delay
    setTimeout(() => {
      const currentCount = displayedNotifications.length;
      const nextBatch = notifications.slice(currentCount, currentCount + 10);

      if (nextBatch.length > 0) {
        setDisplayedNotifications(prev => [...prev, ...nextBatch]);
        setHasMore(currentCount + nextBatch.length < notifications.length);
      } else {
        setHasMore(false);
      }

      setLoading(false);
    }, 500);
  }, [displayedNotifications.length, notifications, loading, hasMore]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when user is 200px from bottom
      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ai_coach':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'mentor_message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'mission_due':
        return <Target className="w-5 h-5 text-red-400" />;
      case 'quiz_ready':
        return <Award className="w-5 h-5 text-green-400" />;
      case 'video_next':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'community_mention':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'track_progress':
        return <CheckCircle className="w-5 h-5 text-cyan-400" />;
      case 'assessment_blocked':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ai_coach':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'mentor_message':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'mission_due':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'quiz_ready':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'video_next':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'community_mention':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'track_progress':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'assessment_blocked':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'ai_coach':
        return 'AI Coach';
      case 'mentor_message':
        return 'Mentor';
      case 'mission_due':
        return 'Mission';
      case 'quiz_ready':
        return 'Quiz';
      case 'video_next':
        return 'Video';
      case 'community_mention':
        return 'Community';
      case 'track_progress':
        return 'Progress';
      case 'assessment_blocked':
        return 'Assessment';
      default:
        return 'Notification';
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // In production, this would call the API
      console.log(`Marking notification ${notificationId} as read`);

      // Update local state
      setDisplayedNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );

      onRefresh?.();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleBatchDismiss = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      const notificationIds = Array.from(selectedNotifications);

      // In production, this would call the API
      console.log(`Dismissing ${notificationIds.length} notifications:`, notificationIds);

      // Remove from local state
      setDisplayedNotifications(prev =>
        prev.filter(notif => !selectedNotifications.has(notif.id))
      );
      setSelectedNotifications(new Set());

      onRefresh?.();
    } catch (error) {
      console.error('Failed to dismiss notifications:', error);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  if (displayedNotifications.length === 0) {
    return (
      <Card className="p-8 bg-slate-900/50 border-slate-700 text-center">
        <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">No notifications yet</h3>
        <p className="text-slate-400">
          You'll see updates from your mentors, AI coach, and mission progress here.
        </p>
      </Card>
    );
  }

  const unreadCount = displayedNotifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      {/* Header with batch actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedNotifications.size > 0 ? (
            <>
              <span className="text-slate-400 text-sm">
                {selectedNotifications.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDismiss}
                className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Dismiss Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedNotifications(new Set())}
                className="text-slate-400 border-slate-600"
              >
                Cancel
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {unreadCount} unread
              </Badge>
              <span className="text-slate-400 text-sm">
                {displayedNotifications.length} of {notifications.length} notifications
              </span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="text-slate-400 border-slate-600 hover:text-white"
        >
          Refresh
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayedNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200 ${
              !notification.is_read ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {notification.avatar_url ? (
                  <img
                    src={notification.avatar_url}
                    alt={notification.avatar_initials || 'Avatar'}
                    className="w-10 h-10 rounded-full bg-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold">
                    {notification.avatar_initials || 'N'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs px-2 py-0.5 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                      <span className="ml-1">{getNotificationTypeLabel(notification.type)}</span>
                    </Badge>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Selection checkbox when in batch mode */}
                  {selectedNotifications.size > 0 && (
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => toggleNotificationSelection(notification.id)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                  )}
                </div>

                <h4 className="text-white font-medium mb-1">{notification.title}</h4>
                <p className="text-slate-300 text-sm mb-3 leading-relaxed">{notification.body}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                    {notification.track_slug && (
                      <Badge className="text-xs px-1.5 py-0.5 bg-slate-500/20 text-slate-400">
                        {notification.track_slug}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Primary CTA */}
                    {notification.action_url && notification.cta_text && (
                      <Link href={notification.action_url}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          {notification.cta_text}
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}

                    {/* Mark as read/unread */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {notification.is_read ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>

                    {/* More actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNotificationSelection(notification.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
            Loading more notifications...
          </div>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && displayedNotifications.length > 0 && (
        <div className="text-center py-8">
          <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">You're all caught up!</p>
          <p className="text-slate-500 text-xs">New notifications will appear here automatically.</p>
        </div>
      )}
    </div>
  );
}
