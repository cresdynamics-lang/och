"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, Users, MessageCircle, TrendingUp, AlertTriangle,
  Pin, Eye, EyeOff, Trash2, Flag, CheckCircle, XCircle,
  BarChart3, Calendar, Award, Filter, Search, RefreshCw,
  ChevronDown, MoreHorizontal, Star, Clock
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import type { University, PostListItem, UserCommunityStats } from "@/services/types/community"

interface FacultyDashboardProps {
  userId: string
  universityId: string
  university?: University
}

interface ModerationItem {
  id: string
  type: 'post' | 'comment'
  content: string
  author: {
    id: string
    name: string
    avatar_url?: string
  }
  reportCount: number
  reportReasons: string[]
  createdAt: string
  status: 'pending' | 'approved' | 'hidden' | 'deleted'
}

interface UniversityAnalytics {
  totalStudents: number
  activeStudents: number
  totalPosts: number
  totalComments: number
  postsThisWeek: number
  engagementRate: number
  topContributors: {
    id: string
    name: string
    avatar_url?: string
    posts: number
    points: number
  }[]
  circleDistribution: {
    circle: number
    count: number
    percentage: number
  }[]
  activityTrend: {
    date: string
    posts: number
    comments: number
    reactions: number
  }[]
}

// Mock data for demo
const mockAnalytics: UniversityAnalytics = {
  totalStudents: 1234,
  activeStudents: 456,
  totalPosts: 2890,
  totalComments: 8976,
  postsThisWeek: 127,
  engagementRate: 68.5,
  topContributors: [
    { id: '1', name: 'John Doe', posts: 45, points: 1250 },
    { id: '2', name: 'Jane Smith', posts: 38, points: 1120 },
    { id: '3', name: 'Mike Johnson', posts: 32, points: 980 },
  ],
  circleDistribution: [
    { circle: 1, count: 450, percentage: 36.5 },
    { circle: 2, count: 320, percentage: 25.9 },
    { circle: 3, count: 280, percentage: 22.7 },
    { circle: 4, count: 120, percentage: 9.7 },
    { circle: 5, count: 64, percentage: 5.2 },
  ],
  activityTrend: [
    { date: '2024-01-15', posts: 45, comments: 120, reactions: 340 },
    { date: '2024-01-16', posts: 52, comments: 145, reactions: 380 },
    { date: '2024-01-17', posts: 38, comments: 98, reactions: 290 },
    { date: '2024-01-18', posts: 61, comments: 167, reactions: 420 },
    { date: '2024-01-19', posts: 48, comments: 134, reactions: 356 },
  ],
}

const mockModerationQueue: ModerationItem[] = [
  {
    id: '1',
    type: 'post',
    content: 'This post contains potentially inappropriate content...',
    author: { id: '1', name: 'Anonymous User' },
    reportCount: 3,
    reportReasons: ['spam', 'inappropriate'],
    createdAt: '2024-01-19T10:30:00Z',
    status: 'pending',
  },
  {
    id: '2',
    type: 'comment',
    content: 'Offensive comment that needs review...',
    author: { id: '2', name: 'Test User' },
    reportCount: 5,
    reportReasons: ['harassment', 'offensive'],
    createdAt: '2024-01-19T09:15:00Z',
    status: 'pending',
  },
]

type DashboardTab = 'overview' | 'moderation' | 'announcements' | 'students'

export function FacultyDashboard({ userId, universityId, university }: FacultyDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [analytics, setAnalytics] = useState<UniversityAnalytics>(mockAnalytics)
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>(mockModerationQueue)
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week')

  // Mock fetch - replace with actual API calls
  useEffect(() => {
    // Fetch analytics and moderation queue
    setLoading(true)
    setTimeout(() => {
      setAnalytics(mockAnalytics)
      setModerationQueue(mockModerationQueue)
      setLoading(false)
    }, 500)
  }, [universityId, selectedPeriod])

  const handleModerateItem = useCallback(async (
    itemId: string, 
    action: 'approve' | 'hide' | 'delete'
  ) => {
    // Update local state optimistically
    setModerationQueue(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: action === 'approve' ? 'approved' : action === 'hide' ? 'hidden' : 'deleted' }
        : item
    ))
    
    // TODO: API call to moderate
    console.log(`Moderating item ${itemId} with action ${action}`)
  }, [])

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'moderation', label: 'Moderation', icon: <Flag className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {university?.logo_url ? (
                <img 
                  src={university.logo_url} 
                  alt={university.name}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white/10"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                  {university?.code?.[0] || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">Faculty Dashboard</h1>
                <p className="text-slate-400">{university?.name || 'University'} Community Management</p>
              </div>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-2">
              {(['week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                    selectedPeriod === p
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
                  activeTab === tab.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'moderation' && moderationQueue.filter(i => i.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {moderationQueue.filter(i => i.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Students"
                  value={analytics.totalStudents}
                  icon={<Users className="w-5 h-5" />}
                  color="indigo"
                />
                <StatCard
                  label="Active Students"
                  value={analytics.activeStudents}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="emerald"
                  trend={+12.5}
                />
                <StatCard
                  label="Posts This Week"
                  value={analytics.postsThisWeek}
                  icon={<MessageCircle className="w-5 h-5" />}
                  color="purple"
                  trend={+8.3}
                />
                <StatCard
                  label="Engagement Rate"
                  value={`${analytics.engagementRate}%`}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="amber"
                  trend={+5.2}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Activity Trend</h3>
                  <div className="h-48 flex items-end gap-2">
                    {analytics.activityTrend.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-indigo-500/30 rounded-t"
                          style={{ height: `${(day.posts / 70) * 100}%` }}
                        />
                        <span className="text-xs text-slate-500">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Circle Distribution */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Circle Distribution</h3>
                  <div className="space-y-3">
                    {analytics.circleDistribution.map((item) => (
                      <div key={item.circle} className="flex items-center gap-3">
                        <span className="w-16 text-sm text-slate-400">Circle {item.circle}</span>
                        <div className="flex-1 bg-slate-700/50 rounded-full h-2.5">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm text-slate-400">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Contributors */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Contributors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.topContributors.map((user, i) => (
                    <div 
                      key={user.id}
                      className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                        i === 0 && "bg-amber-500/20 text-amber-400",
                        i === 1 && "bg-slate-400/20 text-slate-300",
                        i === 2 && "bg-orange-600/20 text-orange-400"
                      )}>
                        #{i + 1}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-indigo-600">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.posts} posts • {user.points} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && (
            <motion.div
              key="moderation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Moderation Queue</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {moderationQueue.filter(i => i.status === 'pending').length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 rounded-xl">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                  <p className="text-slate-400">No items pending moderation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moderationQueue.filter(i => i.status === 'pending').map((item) => (
                    <ModerationCard
                      key={item.id}
                      item={item}
                      onModerate={handleModerateItem}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">University Announcements</h2>
                <Button variant="defender">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </div>

              <div className="text-center py-16 bg-slate-800/30 rounded-xl">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Announcements</h3>
                <p className="text-slate-400 mb-4">Create an announcement to notify all students</p>
                <Button variant="defender">Create First Announcement</Button>
              </div>
            </motion.div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Student Activity</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Student</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Circle</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Posts</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Points</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Last Active</th>
                      <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topContributors.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                            Circle 3
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{user.posts}</td>
                        <td className="p-4 text-slate-300">{user.points}</td>
                        <td className="p-4 text-slate-400 text-sm">2 hours ago</td>
                        <td className="p-4 text-right">
                          <Button variant="outline" size="sm">View Profile</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color, 
  trend 
}: { 
  label: string
  value: string | number
  icon: React.ReactNode
  color: 'indigo' | 'emerald' | 'purple' | 'amber'
  trend?: number
}) {
  const colorClasses = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={cn("p-2 rounded-lg", colorClasses[color])}>
          {icon}
        </span>
        {trend !== undefined && (
          <span className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend > 0 ? "text-emerald-400" : "text-red-400"
          )}>
            <TrendingUp className="w-3 h-3" />
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  )
}

// Moderation Card Component
function ModerationCard({ 
  item, 
  onModerate 
}: { 
  item: ModerationItem
  onModerate: (id: string, action: 'approve' | 'hide' | 'delete') => void
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2 rounded-lg",
          item.reportCount >= 5 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
        )}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
              {item.type}
            </span>
            <span className="text-xs text-slate-500">
              {item.reportCount} reports
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-slate-200 text-sm mb-2 line-clamp-2">{item.content}</p>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500">By:</span>
            <span className="text-xs text-slate-300">{item.author.name}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {item.reportReasons.map((reason) => (
              <span key={reason} className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded">
                {reason}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onModerate(item.id, 'approve')}
              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onModerate(item.id, 'hide')}
              className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Hide
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onModerate(item.id, 'delete')}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

