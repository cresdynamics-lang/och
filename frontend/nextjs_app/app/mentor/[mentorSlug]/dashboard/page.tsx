'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StudentDetailModal } from '@/components/mentor/StudentDetailModal'
import {
  Users,
  Calendar,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Zap,
  Star,
  BookOpen,
  Award,
  UserCheck,
  BarChart3
} from 'lucide-react'

// Types
interface MentorDashboardData {
  mentor: {
    id: string
    slug: string
    full_name: string
    bio: string
    expertise_tracks: string[]
    capacity: number
    assigned_students_count: number
  }
  assigned_students: any[]
  today_priorities: PriorityItem[]
  today_schedule: SessionItem[]
  cohort_analytics: CohortAnalytics
}

interface PriorityItem {
  id: string
  type: 'quiz_reviews' | 'at_risk_students' | 'sessions' | 'assignments'
  title: string
  description: string
  priority: number
  action_url: string
  items: any[]
  total_count: number
}

interface SessionItem {
  id: string
  student_name: string
  track: string
  title: string
  scheduled_at: string
  duration_minutes: number
  meeting_url?: string
}

interface CohortAnalytics {
  total_students: number
  tracks_distribution: Record<string, number>
  average_completion: number
  completion_distribution: Record<string, number>
  recent_activity: Record<string, number>
  top_performers: Array<{name: string, completion: number, track: string}>
  needs_help: Array<{name: string, completion: number, track: string, days_stuck: number}>
}

// Sidebar tabs
type SidebarTab = 'students' | 'schedule' | 'analytics' | 'settings'

export default function MentorDashboardPage() {
  const { mentorSlug } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState<MentorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<SidebarTab>('students')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentDetailOpen, setStudentDetailOpen] = useState(false)

  useEffect(() => {
    if (user?.id && mentorSlug) {
      fetchDashboardData()
    }
  }, [user?.id, mentorSlug])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/mentors/${mentorSlug}/dashboard`)

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading mentor dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-400 mb-4">{error || 'An unexpected error occurred.'}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'mr-0' : 'mr-80'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  👨‍🏫 {data.mentor.full_name}
                </h1>
                <p className="text-slate-300 text-lg">
                  Mentor Dashboard • {data.mentor.assigned_students_count} students
                </p>
              </div>

              {/* Sidebar Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
              >
                {sidebarCollapsed ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-2">
              {data.mentor.expertise_tracks.map(track => (
                <Badge key={track} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {track}
                </Badge>
              ))}
            </div>
          </div>

          {/* Cohort Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🎯 Cohort Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.assigned_students.slice(0, 6).map((student, index) => (
                <StudentCard
                  key={student.id || index}
                  student={student}
                  onViewClick={(studentId) => {
                    setSelectedStudentId(studentId)
                    setStudentDetailOpen(true)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Today's Priorities */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">⚡ Today's Priorities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.today_priorities.map(priority => (
                <PriorityCard key={priority.id} priority={priority} />
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          {data.today_schedule.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">📅 Today's Schedule</h2>
              <div className="space-y-3">
                {data.today_schedule.map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={studentDetailOpen}
        onClose={() => {
          setStudentDetailOpen(false)
          setSelectedStudentId(null)
        }}
        mentorSlug={mentorSlug as string}
        studentId={selectedStudentId || ''}
      />

      {/* Sidebar */}
      {!sidebarCollapsed && (
        <div className="w-80 bg-slate-900 border-l border-slate-700 fixed right-0 top-0 h-full overflow-hidden">
          <SidebarContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            data={data}
            onViewStudent={(studentId) => {
              setSelectedStudentId(studentId)
              setStudentDetailOpen(true)
            }}
          />
        </div>
      )}
    </div>
  )
}

// Student Card Component
function StudentCard({ student, onViewClick }: { student: any; onViewClick: (studentId: string) => void }) {
  return (
    <Card className="p-4 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{student.name || 'Student'}</h3>
            <p className="text-sm text-slate-400">{student.track || 'Track'}</p>
          </div>
        </div>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          {student.completion || 0}%
        </Badge>
      </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onViewClick(student.id)}
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Note
                </Button>
              </div>
    </Card>
  )
}

// Priority Card Component
function PriorityCard({ priority }: { priority: PriorityItem }) {
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'border-red-500/50 bg-red-500/10'
      case 2: return 'border-orange-500/50 bg-orange-500/10'
      case 3: return 'border-blue-500/50 bg-blue-500/10'
      default: return 'border-slate-500/50 bg-slate-500/10'
    }
  }

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'quiz_reviews': return <Award className="w-5 h-5" />
      case 'at_risk_students': return <AlertCircle className="w-5 h-5" />
      case 'sessions': return <Calendar className="w-5 h-5" />
      case 'assignments': return <Users className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  return (
    <Card className={`p-4 border ${getPriorityColor(priority.priority)}`}>
      <div className="flex items-start gap-3">
        <div className="text-red-400 mt-0.5">
          {getPriorityIcon(priority.type)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{priority.title}</h3>
          <p className="text-sm text-slate-400 mb-3">{priority.description}</p>

          {priority.items.length > 0 && (
            <div className="space-y-2 mb-3">
              {priority.items.slice(0, 2).map((item, index) => (
                <div key={index} className="text-sm text-slate-300 bg-slate-700/30 rounded px-2 py-1">
                  {item.student_name || item.title}
                </div>
              ))}
              {priority.items.length > 2 && (
                <div className="text-sm text-slate-400">
                  +{priority.items.length - 2} more
                </div>
              )}
            </div>
          )}

          <Button size="sm" className="w-full">
            Take Action
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Session Card Component
function SessionCard({ session }: { session: SessionItem }) {
  return (
    <Card className="p-4 bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{session.title}</h3>
            <p className="text-sm text-slate-400">
              {session.student_name} • {session.track}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium text-white">
            {new Date(session.scheduled_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-xs text-slate-400">{session.duration_minutes}min</p>
        </div>
      </div>

      {session.meeting_url && (
        <div className="mt-3">
          <Button size="sm" className="w-full">
            <Zap className="w-3 h-3 mr-1" />
            Join Meeting
          </Button>
        </div>
      )}
    </Card>
  )
}

// Sidebar Content Component
function SidebarContent({
  activeTab,
  setActiveTab,
  data,
  onViewStudent
}: {
  activeTab: SidebarTab
  setActiveTab: (tab: SidebarTab) => void
  data: MentorDashboardData
  onViewStudent: (studentId: string) => void
}) {
  const tabs = [
    { id: 'students' as const, label: 'Students', icon: Users },
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="p-4 border-b border-slate-700">
        <nav className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'students' && <StudentsTab data={data} onViewStudent={onViewStudent} />}
        {activeTab === 'schedule' && <ScheduleTab data={data} />}
        {activeTab === 'analytics' && <AnalyticsTab data={data} />}
        {activeTab === 'settings' && <SettingsTab data={data} />}
        {activeTab === 'schedule' && <ScheduleTab data={data} />}
        {activeTab === 'analytics' && <AnalyticsTab data={data} />}
        {activeTab === 'settings' && <SettingsTab data={data} />}
      </div>
    </div>
  )
}

// Students Tab
function StudentsTab({ data, onViewStudent }: { data: MentorDashboardData; onViewStudent: (studentId: string) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">👥 My Students</h3>

      <div className="space-y-3">
        {data.assigned_students.map((student, index) => (
          <div key={student.id || index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">{student.name || 'Student'}</h4>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {student.completion || 0}%
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mb-3">{student.track || 'Track'}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => onViewStudent(student.id)}
                >
                  View Progress
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  Add Note
                </Button>
              </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Schedule Tab
function ScheduleTab({ data }: { data: MentorDashboardData }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">📅 Schedule</h3>

      {data.today_schedule.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Today</h4>
          {data.today_schedule.map(session => (
            <div key={session.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white text-sm">{session.title}</h4>
                <span className="text-xs text-slate-400">
                  {new Date(session.scheduled_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-400">{session.student_name}</p>
              <Button size="sm" className="w-full mt-2 text-xs">
                Join Meeting
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No sessions scheduled for today</p>
        </div>
      )}

      <Button className="w-full mt-4">
        + Schedule 1:1 Session
      </Button>
    </div>
  )
}

// Analytics Tab
function AnalyticsTab({ data }: { data: MentorDashboardData }) {
  const analytics = data.cohort_analytics

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Analytics</h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-2xl font-bold text-white">{analytics.total_students}</div>
          <div className="text-sm text-slate-400">Total Students</div>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-2xl font-bold text-white">{analytics.average_completion}%</div>
          <div className="text-sm text-slate-400">Avg Completion</div>
        </div>
      </div>

      {/* Completion Distribution */}
      <div>
        <h4 className="text-sm font-medium text-white mb-3">Completion Distribution</h4>
        <div className="space-y-2">
          {Object.entries(analytics.completion_distribution).map(([level, count]) => (
            <div key={level} className="flex items-center justify-between text-sm">
              <span className="text-slate-400 capitalize">{level.replace('_', ' ')}</span>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div>
        <h4 className="text-sm font-medium text-white mb-3">🏆 Top Performers</h4>
        <div className="space-y-2">
          {analytics.top_performers.map((student, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{student.name}</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {student.completion}%
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Needs Help */}
      <div>
        <h4 className="text-sm font-medium text-white mb-3">⚠️ Needs Attention</h4>
        <div className="space-y-2">
          {analytics.needs_help.map((student, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{student.name}</span>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {student.completion}%
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Settings Tab
function SettingsTab({ data }: { data: MentorDashboardData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">⚙️ Settings</h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-white mb-2">Profile</h4>
          <Button variant="outline" className="w-full justify-start">
            <Users className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white mb-2">Availability</h4>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="w-4 h-4 mr-2" />
            Set Availability
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white mb-2">Expertise</h4>
          <Button variant="outline" className="w-full justify-start">
            <Star className="w-4 h-4 mr-2" />
            Update Expertise
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white mb-2">Notifications</h4>
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
