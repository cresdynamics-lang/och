'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import {
  X,
  User,
  Target,
  BookOpen,
  Award,
  MessageSquare,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface StudentDetail {
  student: {
    id: string
    email: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  assignment: {
    track_slug: string
    assigned_at: string
    feedback_rating?: number
    last_interaction_at?: string
  }
  progress: {
    track: string
    overall_completion: number
    missions_completed: number
    total_missions: number
    quizzes_passed: number
    total_quizzes: number
    current_level: string
    time_spent_hours: number
    last_activity: string
    readiness_score: number
    strengths: string[]
    areas_for_improvement: string[]
  }
  recent_notes: Array<{
    id: string
    note_type: string
    content: string
    created_at: string
  }>
  recent_sessions: Array<{
    id: string
    title: string
    scheduled_at: string
    status: string
    student_feedback?: string
  }>
}

interface StudentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  mentorSlug: string
  studentId: string
}

export function StudentDetailModal({
  isOpen,
  onClose,
  mentorSlug,
  studentId
}: StudentDetailModalProps) {
  const [data, setData] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState('strength')

  useEffect(() => {
    if (isOpen && mentorSlug && studentId) {
      fetchStudentDetail()
    }
  }, [isOpen, mentorSlug, studentId])

  const fetchStudentDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/mentors/${mentorSlug}/students/${studentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch student details')
      }

      const studentData = await response.json()
      setData(studentData)
    } catch (err: any) {
      console.error('Student detail fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!data || !noteContent.trim()) return

    try {
      const response = await fetch(`/api/mentors/${mentorSlug}/students/${studentId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note_type: noteType,
          content: noteContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      // Refresh data to show new note
      await fetchStudentDetail()
      setNoteContent('')
      setShowAddNote(false)
    } catch (err: any) {
      console.error('Add note error:', err)
      setError(err.message)
    }
  }

  const handleBoostStudent = async () => {
    if (!data) return

    try {
      const response = await fetch(`/api/mentors/${mentorSlug}/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'student',
          target_ids: [studentId],
          track_slug: data.assignment.track_slug,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to boost student')
      }

      const result = await response.json()
      alert(`Student boosted! ${result.message}`)
    } catch (err: any) {
      console.error('Boost student error:', err)
      setError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            {data ? `${data.student.first_name} ${data.student.last_name}` : 'Student Details'}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading student details...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {data.student.first_name} {data.student.last_name}
                </h2>
                <p className="text-slate-400">{data.student.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {data.assignment.track_slug}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {data.progress.current_level}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowAddNote(true)} variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
                <Button onClick={handleBoostStudent} size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Boost Student
                </Button>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-slate-800/50 border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-400">Overall Progress</p>
                    <p className="text-2xl font-bold text-white">{data.progress.overall_completion}%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-800/50 border-slate-700/50">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm text-slate-400">Missions</p>
                    <p className="text-2xl font-bold text-white">
                      {data.progress.missions_completed}/{data.progress.total_missions}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-800/50 border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-sm text-slate-400">Quizzes</p>
                    <p className="text-2xl font-bold text-white">
                      {data.progress.quizzes_passed}/{data.progress.total_quizzes}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Detailed Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">📊 Progress Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Readiness Score</span>
                    <span className="text-white font-medium">{data.progress.readiness_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time Spent</span>
                    <span className="text-white font-medium">{data.progress.time_spent_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Activity</span>
                    <span className="text-white font-medium">{data.progress.last_activity}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">💪 Strengths</h3>
                <div className="space-y-2">
                  {data.progress.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300">{strength}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-white mb-4 mt-6">🎯 Areas for Improvement</h3>
                <div className="space-y-2">
                  {data.progress.areas_for_improvement.map((area, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-slate-300">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">📅 Recent Sessions</h3>
              {data.recent_sessions.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_sessions.map(session => (
                    <Card key={session.id} className="p-4 bg-slate-800/50 border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{session.title}</h4>
                          <p className="text-sm text-slate-400">
                            {new Date(session.scheduled_at).toLocaleDateString()} • {session.status}
                          </p>
                        </div>
                        <Badge className={
                          session.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }>
                          {session.status}
                        </Badge>
                      </div>
                      {session.student_feedback && (
                        <div className="mt-3 p-3 bg-slate-700/30 rounded">
                          <p className="text-sm text-slate-300">"{session.student_feedback}"</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No recent sessions</p>
              )}
            </div>

            {/* Recent Notes */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">📝 Recent Notes</h3>
              {data.recent_notes.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_notes.map(note => (
                    <Card key={note.id} className="p-4 bg-slate-800/50 border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={
                          note.note_type === 'strength'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : note.note_type === 'improvement'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }>
                          {note.note_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300">{note.content}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No notes yet</p>
              )}
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Add Note</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Note Type
                  </label>
                  <Select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                    <option value="strength">Strength</option>
                    <option value="improvement">Improvement Area</option>
                    <option value="action_item">Action Item</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Note Content
                  </label>
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter your note..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddNote} disabled={!noteContent.trim()}>
                    Add Note
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddNote(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
