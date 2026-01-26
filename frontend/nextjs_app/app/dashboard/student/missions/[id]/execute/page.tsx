'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ChevronLeft, 
  ChevronRight,
  Loader2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Circle,
  Upload,
  FileText,
  Flag,
  Play,
  Pause,
  Target,
  Save
} from 'lucide-react'
import Link from 'next/link'

interface Subtask {
  id: string
  title: string
  description: string
  order: number
  requirements?: string[]
  completed?: boolean
}

interface MissionProgress {
  id: string
  mission: {
    id: string
    code: string
    title: string
    description: string
    difficulty: string
    track_key: string
    estimated_duration_minutes?: number
    objectives?: string[]
    subtasks?: Subtask[]
  }
  status: string
  progress_percent: number
  current_subtask_index?: number
  time_spent_minutes?: number
  started_at?: string
}

interface SubtaskCompletionResponse {
  all_complete: boolean
  next_subtask_index?: number
}

export default function MissionExecutePage() {
  const params = useParams()
  const router = useRouter()
  const missionId = params.id as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [progress, setProgress] = useState<MissionProgress | null>(null)
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [artifacts, setArtifacts] = useState<File[]>([])
  const [notes, setNotes] = useState('')

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
    }
  }, [isAuthenticated, authLoading, router])

  // Load mission progress
  useEffect(() => {
    if (!isAuthenticated || authLoading || !missionId) return

    const loadProgress = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiGateway.get<MissionProgress>(
          `/student/missions/${missionId}/progress`
        )
        setProgress(response)
        setCurrentSubtaskIndex(response.current_subtask_index || 0)
      } catch (err: any) {
        console.error('Failed to load mission progress:', err)
        setError(err?.message || 'Failed to load mission progress')
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [missionId, isAuthenticated, authLoading])

  const handleSaveProgress = async () => {
    if (!progress) return
    
    setSaving(true)
    try {
      await apiGateway.patch(`/student/missions/${missionId}/progress`, {
        current_subtask_index: currentSubtaskIndex,
        notes,
        status: 'in_progress'
      })
      alert('Progress saved successfully!')
    } catch (err: any) {
      console.error('Failed to save progress:', err)
      alert('Failed to save progress. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteSubtask = async () => {
    if (!progress) return

    setSaving(true)
    try {
      const response = await apiGateway.post<SubtaskCompletionResponse>(
        `/student/missions/${missionId}/subtasks/${currentSubtaskIndex}/complete`,
        { notes }
      )

      const subtasks = progress.mission.subtasks || []
      
      if (response.all_complete) {
        // All subtasks complete - navigate to submission
        router.push(`/dashboard/student/missions/${missionId}/submit`)
      } else if (response.next_subtask_index !== undefined) {
        // Move to next subtask
        setCurrentSubtaskIndex(response.next_subtask_index)
        setNotes('')
        // Reload progress to get updated data
        const updatedProgress = await apiGateway.get<MissionProgress>(
          `/student/missions/${missionId}/progress`
        )
        setProgress(updatedProgress)
      }
    } catch (err: any) {
      console.error('Failed to complete subtask:', err)
      alert('Failed to complete subtask. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArtifacts(Array.from(e.target.files))
    }
  }

  if (!isAuthenticated || authLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-och-gold" />
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-och-gold mx-auto" />
          </motion.div>
          <p className="text-och-steel">Loading mission...</p>
        </div>
      </div>
    )
  }

  if (error || !progress) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Link href={`/dashboard/student/missions/${missionId}`}>
            <motion.div
              whileHover={{ x: -4 }}
              className="inline-flex items-center gap-2 text-och-defender hover:text-och-gold transition-colors mb-6"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Back to Mission</span>
            </motion.div>
          </Link>
          <Card className="p-8 bg-och-midnight/90 border border-och-defender/40">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-och-defender flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Failed to Load Mission</h2>
                <p className="text-och-steel mt-1">{error || 'Mission progress not found'}</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="defender"
              className="mt-4"
            >
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const subtasks = progress.mission.subtasks || []
  const currentSubtask = subtasks[currentSubtaskIndex]
  const progressPercent = subtasks.length > 0 ? ((currentSubtaskIndex + 1) / subtasks.length) * 100 : 0

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Top Navigation Bar */}
      <div className="w-full border-b border-och-steel/10 bg-och-midnight/40 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href={`/dashboard/student/missions/${missionId}`}>
              <motion.div
                whileHover={{ x: -4 }}
                className="inline-flex items-center gap-2 text-och-defender hover:text-och-gold transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-widest">Exit Mission</span>
              </motion.div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-och-midnight/60">
                <Target className="w-4 h-4 text-och-gold" />
                <span className="text-sm text-och-steel">
                  {currentSubtaskIndex + 1} / {subtasks.length}
                </span>
              </div>

              <Button
                onClick={handleSaveProgress}
                disabled={saving}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-och-midnight/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-och-defender to-och-gold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Work Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mission Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 bg-gradient-to-r from-och-defender/20 to-och-orange/20 border border-och-defender/40">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-bold text-och-gold">
                        {progress.mission.code}
                      </span>
                      <span className="text-och-steel text-sm">•</span>
                      <span className="text-och-steel text-sm capitalize">
                        {progress.mission.difficulty}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {progress.mission.title}
                    </h1>
                    <p className="text-och-steel">
                      {progress.mission.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Current Subtask */}
            {currentSubtask && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSubtaskIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-och-defender/20 border-2 border-och-defender flex items-center justify-center">
                        <span className="text-lg font-bold text-och-defender">
                          {currentSubtaskIndex + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-white mb-2">
                          {currentSubtask.title}
                        </h2>
                        <p className="text-och-steel">
                          {currentSubtask.description}
                        </p>
                      </div>
                    </div>

                    {/* Requirements */}
                    {currentSubtask.requirements && currentSubtask.requirements.length > 0 && (
                      <div className="mt-6 p-4 rounded-lg bg-och-midnight/40 border border-och-steel/10">
                        <h3 className="text-sm font-semibold text-white mb-3">Requirements:</h3>
                        <ul className="space-y-2">
                          {currentSubtask.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-och-mint mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-och-steel">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Work Area */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Notes & Documentation
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={8}
                          className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:border-och-defender focus:outline-none"
                          placeholder="Document your work, findings, and steps taken..."
                        />
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Upload Artifacts (Screenshots, Files, Evidence)
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-och-steel/20 rounded-lg hover:border-och-defender/40 cursor-pointer transition-all"
                          >
                            <Upload className="w-6 h-6 text-och-steel" />
                            <span className="text-och-steel">
                              {artifacts.length > 0
                                ? `${artifacts.length} file(s) selected`
                                : 'Click to upload files'}
                            </span>
                          </label>
                        </div>
                        {artifacts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {artifacts.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-och-steel">
                                <FileText className="w-4 h-4" />
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-between gap-4">
                      <Button
                        onClick={() => setCurrentSubtaskIndex(Math.max(0, currentSubtaskIndex - 1))}
                        disabled={currentSubtaskIndex === 0}
                        variant="ghost"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>

                      <Button
                        onClick={handleCompleteSubtask}
                        disabled={saving}
                        variant="defender"
                        className="px-8"
                      >
                        {saving ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : currentSubtaskIndex === subtasks.length - 1 ? (
                          <><Flag className="w-4 h-4 mr-2" /> Complete Mission</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete</>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mission Objectives */}
            {progress.mission.objectives && progress.mission.objectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                  <h3 className="text-lg font-bold text-white mb-4">Mission Objectives</h3>
                  <ul className="space-y-3">
                    {progress.mission.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-och-mint mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-och-steel">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}

            {/* Subtasks Overview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                <h3 className="text-lg font-bold text-white mb-4">Progress Tracker</h3>
                <div className="space-y-3">
                  {subtasks.map((subtask, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSubtaskIndex(idx)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        idx === currentSubtaskIndex
                          ? 'bg-och-defender/20 border border-och-defender/40'
                          : idx < currentSubtaskIndex
                          ? 'bg-och-mint/10 border border-och-mint/20'
                          : 'bg-och-midnight/40 border border-och-steel/10 hover:border-och-steel/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {idx < currentSubtaskIndex ? (
                          <CheckCircle2 className="w-5 h-5 text-och-mint flex-shrink-0" />
                        ) : idx === currentSubtaskIndex ? (
                          <div className="w-5 h-5 rounded-full border-2 border-och-defender flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-och-steel/40 flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${
                          idx === currentSubtaskIndex
                            ? 'text-white'
                            : idx < currentSubtaskIndex
                            ? 'text-och-mint'
                            : 'text-och-steel'
                        }`}>
                          {subtask.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Timer */}
            {progress.mission.estimated_duration_minutes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">Time</h3>
                    <Clock className="w-4 h-4 text-och-gold" />
                  </div>
                  <p className="text-2xl font-bold text-och-gold">
                    {progress.time_spent_minutes || 0} min
                  </p>
                  <p className="text-xs text-och-steel mt-1">
                    Est. {Math.ceil(progress.mission.estimated_duration_minutes / 60)}h total
                  </p>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
