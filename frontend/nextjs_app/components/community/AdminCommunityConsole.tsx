"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield, Building2, Users, Globe, AlertTriangle, Settings,
  Search, Filter, RefreshCw, MoreHorizontal, ChevronDown,
  CheckCircle, XCircle, EyeOff, Trash2, Flag, Ban,
  TrendingUp, BarChart3, Activity, Zap, Database,
  Plus, Edit, Copy, ExternalLink
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import type { University } from "@/services/types/community"

interface AdminConsoleProps {
  adminId: string
}

interface GlobalStats {
  totalUsers: number
  totalUniversities: number
  totalPosts: number
  totalComments: number
  activeUsersToday: number
  reportsToday: number
  newUsersThisWeek: number
  engagementRate: number
}

interface ModerationItem {
  id: string
  type: 'post' | 'comment' | 'user'
  content: string
  author: {
    id: string
    name: string
    email: string
    university?: string
  }
  reportCount: number
  reportReasons: string[]
  createdAt: string
  university?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface UniversityListItem extends University {
  status: 'active' | 'pending' | 'suspended'
  adminEmail?: string
}

type AdminTab = 'overview' | 'moderation' | 'universities' | 'users' | 'settings'

// Mock data
const mockStats: GlobalStats = {
  totalUsers: 45678,
  totalUniversities: 156,
  totalPosts: 234567,
  totalComments: 890123,
  activeUsersToday: 12456,
  reportsToday: 23,
  newUsersThisWeek: 1234,
  engagementRate: 72.5,
}

const mockModerationQueue: ModerationItem[] = [
  {
    id: '1',
    type: 'post',
    content: 'Spam content promoting external services...',
    author: { id: '1', name: 'Spam Bot', email: 'spam@fake.com', university: 'Unknown' },
    reportCount: 15,
    reportReasons: ['spam', 'advertising'],
    createdAt: '2024-01-19T10:30:00Z',
    university: 'Global',
    severity: 'critical',
  },
  {
    id: '2',
    type: 'user',
    content: 'User reported for harassment across multiple universities',
    author: { id: '2', name: 'Problem User', email: 'user@test.com', university: 'Test University' },
    reportCount: 8,
    reportReasons: ['harassment', 'threats'],
    createdAt: '2024-01-19T09:15:00Z',
    severity: 'high',
  },
  {
    id: '3',
    type: 'comment',
    content: 'Inappropriate comment with offensive language',
    author: { id: '3', name: 'Anonymous', email: 'anon@mail.com' },
    reportCount: 3,
    reportReasons: ['offensive'],
    createdAt: '2024-01-19T08:00:00Z',
    university: 'Sample University',
    severity: 'medium',
  },
]

const mockUniversities: UniversityListItem[] = [
  {
    id: '1',
    name: 'University of Nairobi',
    code: 'UON',
    slug: 'uon',
    email_domains: ['uonbi.ac.ke', 'students.uonbi.ac.ke'],
    is_verified: true,
    is_active: true,
    allow_cross_university_posts: true,
    member_count: 5600,
    post_count: 12340,
    created_at: '2024-01-01',
    updated_at: '2024-01-19',
    status: 'active',
    adminEmail: 'admin@uonbi.ac.ke',
  },
  {
    id: '2',
    name: 'Kenyatta University',
    code: 'KU',
    slug: 'ku',
    email_domains: ['ku.ac.ke'],
    is_verified: true,
    is_active: true,
    allow_cross_university_posts: true,
    member_count: 4200,
    post_count: 9870,
    created_at: '2024-01-01',
    updated_at: '2024-01-19',
    status: 'active',
    adminEmail: 'admin@ku.ac.ke',
  },
  {
    id: '3',
    name: 'New University',
    code: 'NU',
    slug: 'nu',
    email_domains: ['nu.ac.ke'],
    is_verified: false,
    is_active: false,
    allow_cross_university_posts: false,
    member_count: 0,
    post_count: 0,
    created_at: '2024-01-19',
    updated_at: '2024-01-19',
    status: 'pending',
  },
]

export function AdminCommunityConsole({ adminId }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [stats, setStats] = useState<GlobalStats>(mockStats)
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>(mockModerationQueue)
  const [universities, setUniversities] = useState<UniversityListItem[]>(mockUniversities)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { 
      id: 'moderation', 
      label: 'Global Moderation', 
      icon: <Shield className="w-4 h-4" />,
      badge: moderationQueue.filter(i => i.severity === 'critical' || i.severity === 'high').length
    },
    { id: 'universities', label: 'Universities', icon: <Building2 className="w-4 h-4" /> },
    { id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ]

  const handleModerate = useCallback(async (
    itemId: string, 
    action: 'approve' | 'hide' | 'delete' | 'ban'
  ) => {
    setModerationQueue(prev => prev.filter(item => item.id !== itemId))
    console.log(`Admin action: ${action} on item ${itemId}`)
  }, [])

  const handleUniversityAction = useCallback(async (
    universityId: string,
    action: 'verify' | 'activate' | 'suspend'
  ) => {
    setUniversities(prev => prev.map(uni => {
      if (uni.id === universityId) {
        return {
          ...uni,
          is_verified: action === 'verify' ? true : uni.is_verified,
          is_active: action === 'activate' ? true : action === 'suspend' ? false : uni.is_active,
          status: action === 'suspend' ? 'suspended' : action === 'activate' ? 'active' : uni.status,
        }
      }
      return uni
    }))
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const filteredQueue = moderationQueue.filter(item => {
    if (filterSeverity !== 'all' && item.severity !== filterSeverity) return false
    if (searchQuery && !item.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600/10 via-orange-600/10 to-amber-600/10 border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Console</h1>
                <p className="text-slate-400">OCH Community Platform Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                System Healthy
              </span>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.badge}
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
              {/* Global Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} icon={<Users />} color="indigo" />
                <StatCard label="Universities" value={stats.totalUniversities} icon={<Building2 />} color="purple" />
                <StatCard label="Total Posts" value={(stats.totalPosts / 1000).toFixed(1) + 'k'} icon={<Globe />} color="emerald" />
                <StatCard label="Reports Today" value={stats.reportsToday} icon={<AlertTriangle />} color="red" />
              </div>

              {/* Activity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Active Users Today</h3>
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stats.activeUsersToday.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-emerald-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    +12.5% from yesterday
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">New Users This Week</h3>
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stats.newUsersThisWeek.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    +8.3% growth rate
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Engagement Rate</h3>
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stats.engagementRate}%</div>
                  <div className="flex items-center gap-1 text-purple-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Above target (70%)
                  </div>
                </div>
              </div>

              {/* Recent Critical Issues */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Critical Issues Requiring Attention</h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('moderation')}>
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {moderationQueue.filter(i => i.severity === 'critical').slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div className="flex-1">
                        <div className="text-sm text-white">{item.content.slice(0, 60)}...</div>
                        <div className="text-xs text-slate-400">{item.reportCount} reports • {item.university || 'Global'}</div>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-400 border-red-500/30">
                        Review
                      </Button>
                    </div>
                  ))}
                  {moderationQueue.filter(i => i.severity === 'critical').length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      No critical issues
                    </div>
                  )}
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
              className="space-y-6"
            >
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                    <button
                      key={severity}
                      onClick={() => setFilterSeverity(severity)}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-lg transition-all",
                        filterSeverity === severity
                          ? severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-indigo-500/20 text-indigo-400'
                          : "text-slate-400 hover:bg-slate-800/50"
                      )}
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Queue */}
              <div className="space-y-4">
                {filteredQueue.map((item) => (
                  <div 
                    key={item.id}
                    className={cn(
                      "bg-slate-800/50 rounded-xl border p-4",
                      item.severity === 'critical' ? 'border-red-500/30' :
                      item.severity === 'high' ? 'border-orange-500/30' :
                      'border-slate-700/50'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("px-2 py-1 rounded text-xs font-medium border", getSeverityColor(item.severity))}>
                        {item.severity.toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                            {item.type}
                          </span>
                          <span className="text-xs text-slate-500">{item.reportCount} reports</span>
                          {item.university && (
                            <>
                              <span className="text-xs text-slate-500">•</span>
                              <span className="text-xs text-slate-400">{item.university}</span>
                            </>
                          )}
                        </div>
                        
                        <p className="text-slate-200 text-sm mb-2">{item.content}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span>By: {item.author.name} ({item.author.email})</span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
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
                            onClick={() => handleModerate(item.id, 'approve')}
                            className="text-emerald-400 border-emerald-500/30"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleModerate(item.id, 'hide')}
                            className="text-amber-400 border-amber-500/30"
                          >
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleModerate(item.id, 'delete')}
                            className="text-red-400 border-red-500/30"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                          {item.type === 'user' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleModerate(item.id, 'ban')}
                              className="text-red-400 border-red-500/30"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban User
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredQueue.length === 0 && (
                  <div className="text-center py-16 bg-slate-800/30 rounded-xl">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Queue Clear!</h3>
                    <p className="text-slate-400">No items match your filters</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Universities Tab */}
          {activeTab === 'universities' && (
            <motion.div
              key="universities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">University Management</h2>
                <Button variant="defender">
                  <Plus className="w-4 h-4 mr-2" />
                  Add University
                </Button>
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left p-4 text-sm font-medium text-slate-400">University</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Code</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Members</th>
                      <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                      <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {universities.map((uni) => (
                      <tr key={uni.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {uni.code[0]}
                            </div>
                            <div>
                              <div className="font-medium text-white flex items-center gap-2">
                                {uni.name}
                                {uni.is_verified && (
                                  <CheckCircle className="w-4 h-4 text-blue-400" />
                                )}
                              </div>
                              <div className="text-xs text-slate-400">
                                {uni.email_domains.join(', ')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-mono">{uni.code}</td>
                        <td className="p-4 text-slate-300">{uni.member_count.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            uni.status === 'active' && "bg-emerald-500/20 text-emerald-400",
                            uni.status === 'pending' && "bg-amber-500/20 text-amber-400",
                            uni.status === 'suspended' && "bg-red-500/20 text-red-400"
                          )}>
                            {uni.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {!uni.is_verified && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUniversityAction(uni.id, 'verify')}
                                className="text-blue-400 border-blue-500/30"
                              >
                                Verify
                              </Button>
                            )}
                            {!uni.is_active && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUniversityAction(uni.id, 'activate')}
                                className="text-emerald-400 border-emerald-500/30"
                              >
                                Activate
                              </Button>
                            )}
                            {uni.is_active && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUniversityAction(uni.id, 'suspend')}
                                className="text-red-400 border-red-500/30"
                              >
                                Suspend
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center py-16 bg-slate-800/30 rounded-xl">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                <p className="text-slate-400">Search and manage platform users</p>
                <div className="mt-6 max-w-md mx-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by email, name, or ID..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-white">Platform Settings</h2>

              <div className="grid gap-6">
                <SettingsSection title="Community Rules" description="Configure community guidelines and auto-moderation">
                  <div className="space-y-4">
                    <SettingToggle label="Enable auto-moderation" description="Automatically flag potentially inappropriate content" defaultChecked />
                    <SettingToggle label="Require approval for new posts" description="All posts must be approved by moderators" />
                    <SettingToggle label="Allow cross-university posts" description="Let users post to universities they don't belong to" defaultChecked />
                  </div>
                </SettingsSection>

                <SettingsSection title="Engagement Features" description="Control gamification and engagement features">
                  <div className="space-y-4">
                    <SettingToggle label="Enable leaderboards" description="Show public rankings for students and universities" defaultChecked />
                    <SettingToggle label="Enable badges" description="Award badges for achievements and milestones" defaultChecked />
                    <SettingToggle label="Enable polls" description="Allow users to create poll posts" defaultChecked />
                  </div>
                </SettingsSection>

                <SettingsSection title="Notifications" description="Configure system-wide notification settings">
                  <div className="space-y-4">
                    <SettingToggle label="Send weekly digest" description="Email users with weekly activity summary" defaultChecked />
                    <SettingToggle label="Achievement notifications" description="Notify users when they earn achievements" defaultChecked />
                  </div>
                </SettingsSection>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colorClasses[color])}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  )
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      {children}
    </div>
  )
}

function SettingToggle({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
      <div>
        <div className="font-medium text-white">{label}</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={cn(
          "w-11 h-6 rounded-full transition-colors relative",
          checked ? "bg-indigo-500" : "bg-slate-700"
        )}
      >
        <span className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
          checked ? "left-6" : "left-1"
        )} />
      </button>
    </div>
  )
}

