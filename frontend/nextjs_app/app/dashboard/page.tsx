'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSSE } from '@/hooks/useSSE';
import {
  Target,
  Bell,
  Play,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  Trophy,
  Wifi,
  WifiOff
} from 'lucide-react';
import { NextActionsSection } from '@/components/dashboard/NextActionsSection';
import { NotificationsFeed } from '@/components/dashboard/NotificationsFeed';
import type { ControlCenterData, NotificationItem } from '@/lib/control-center';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [controlCenterData, setControlCenterData] = useState<ControlCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchControlCenterData();
    }
  }, [user?.id]);

  // Real-time updates via Server-Sent Events
  const { isConnected } = useSSE({
    url: user?.id ? `/api/control-center/stream/${user?.id}` : '',
    onEvent: (event) => {
      console.log('Received SSE event:', event);

      switch (event.type) {
        case 'connected':
          setIsOnline(true);
          break;

        case 'notification_new':
          // Add new notification to the feed
          setControlCenterData(prev => {
            if (!prev) return prev;
            const newNotification: NotificationItem = {
              ...event.data,
              avatar_initials: getAvatarInitials(event.data.title),
              cta_text: getCTAForNotification(event.data.type)
            };
            return {
              ...prev,
              notifications: [newNotification, ...prev.notifications],
              summary: {
                ...prev.summary,
                unread_mentor_messages: event.data.type === 'mentor_message'
                  ? prev.summary.unread_mentor_messages + 1
                  : prev.summary.unread_mentor_messages
              }
            };
          });
          break;

        case 'next_actions_updated':
          // Update next actions
          setControlCenterData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              next_actions: event.data
            };
          });
          break;

        case 'summary_updated':
          // Update summary stats
          setControlCenterData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              summary: event.data
            };
          });
          break;
      }
    },
    onError: () => {
      setIsOnline(false);
    },
    onOpen: () => {
      setIsOnline(true);
    },
    onClose: () => {
      setIsOnline(false);
    }
  });

  // Helper functions for SSE events
  const getAvatarInitials = (title: string): string => {
    if (title.includes('AI Coach')) return 'AI';
    if (title.includes('Mentor') || title.includes('Sarah')) return 'SA';
    if (title.includes('Mission')) return '🎯';
    return title.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
  };

  const getCTAForNotification = (type: string): string => {
    switch (type) {
      case 'ai_coach': return 'VIEW';
      case 'mentor_message': return 'REPLY';
      case 'mission_due': return 'CONTINUE';
      case 'quiz_ready': return 'START';
      case 'video_next': return 'WATCH';
      case 'community_mention': return 'VIEW';
      case 'track_progress': return 'SEE PROGRESS';
      case 'assessment_blocked': return 'FIX REQUIREMENTS';
      default: return 'VIEW';
    }
  };

  const fetchControlCenterData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user?.id}/control-center`);

      if (!response.ok) {
        throw new Error('Failed to fetch control center data');
      }

      const data: ControlCenterData = await response.json();
      setControlCenterData(data);
    } catch (err: any) {
      console.error('Error fetching control center data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading your Control Center...</p>
        </div>
      </div>
    );
  }

  if (error || !controlCenterData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Failed to load Control Center</div>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Button onClick={fetchControlCenterData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { next_actions, notifications, summary } = controlCenterData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-slate-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-500/20 rounded-xl">
                <Target className="w-12 h-12 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">🏆 Control Center</h1>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Your single source of truth for learning progress and priorities
                </p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              icon={<Shield className="w-5 h-5" />}
              label="Active Tracks"
              value={summary.tracks_active}
              color="text-emerald-400"
              bgColor="bg-emerald-500/20"
            />
            <SummaryCard
              icon={<Zap className="w-5 h-5" />}
              label="Due Soon (24h)"
              value={summary.missions_due_24h}
              color="text-red-400"
              bgColor="bg-red-500/20"
            />
            <SummaryCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="Unread Messages"
              value={summary.unread_mentor_messages}
              color="text-blue-400"
              bgColor="bg-blue-500/20"
            />
            <SummaryCard
              icon={<Sparkles className="w-5 h-5" />}
              label="AI Recommendations"
              value={summary.ai_recommendations}
              color="text-amber-400"
              bgColor="bg-amber-500/20"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Next Actions Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">🎯 Next Actions</h2>
              <p className="text-slate-400">Your top priorities to advance your learning</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {next_actions.length} actions
            </Badge>
          </div>

          <NextActionsSection actions={next_actions} />
        </div>

        {/* Notifications Feed */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">🔔 Notifications</h2>
              <p className="text-slate-400">Stay updated with mentor feedback, mission deadlines, and AI insights</p>
            </div>
            <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30">
              {notifications.filter(n => !n.is_read).length} unread
            </Badge>
          </div>

          <NotificationsFeed notifications={notifications} onRefresh={fetchControlCenterData} />
        </div>
      </div>
    </div>
  );
}

/**
 * Summary card component for dashboard metrics
 */
function SummaryCard({
  icon,
  label,
  value,
  color,
  bgColor
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="p-4 bg-slate-900/50 border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <div className={color}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}