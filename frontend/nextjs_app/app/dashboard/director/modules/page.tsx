'use client'

import { useState, useEffect } from 'react'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiGateway } from '@/services/apiGateway'
import { Loader2, Trash2 } from 'lucide-react'

// --- Track colors mapping ---
const TRACK_COLORS: Record<string, string> = {
  'defender': 'bg-blue-600',
  'offensive': 'bg-red-600',
  'grc': 'bg-green-600',
  'innovation': 'bg-purple-600',
  'leadership': 'bg-orange-500',
}

const LEVELS = [
  { key: 'beginner',     label: 'Beginner',     tier: 'Tier 2' },
  { key: 'intermediate', label: 'Intermediate', tier: 'Tier 3' },
  { key: 'advanced',     label: 'Advanced',     tier: 'Tier 4' },
  { key: 'capstone',     label: 'Mastery',      tier: 'Tier 5' },
]

const LESSON_TYPES = [
  { key: 'video',      label: 'Video' },
  { key: 'guide',      label: 'Guide / Article' },
  { key: 'quiz',       label: 'Quiz' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'lab',        label: 'Lab' },
  { key: 'reading',    label: 'Reading' },
]

// --- Types ---

interface CurriculumModule {
  id: string
  title: string
  description: string
  track_key: string
  level: string
  order_index: number
  estimated_time_minutes?: number
  lesson_count: number
  mission_count: number
  is_core: boolean
  is_required: boolean
}

interface Lesson {
  id: string
  title: string
  lesson_type: string
  content_url: string
  duration_minutes?: number
  order_index: number
}

// --- Main Page ---

interface Track {
  slug: string
  name: string
  code: string
}

export default function ModulesPage() {
  const [modules, setModules] = useState<CurriculumModule[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterTrack, setFilterTrack] = useState<string>('all')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null)
  const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({})
  const [addLessonToModule, setAddLessonToModule] = useState<CurriculumModule | null>(null)
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)

  useEffect(() => {
    fetchTracks()
    fetchModules()
  }, [filterTrack, filterLevel])

  const fetchTracks = async () => {
    try {
      const data = await apiGateway.get('/curriculum/tracks/') as any
      const trackList = data?.results || data?.data || data || []
      setTracks(trackList)
    } catch (error) {
      console.error('Failed to fetch tracks:', error)
    }
  }

  const fetchModules = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTrack !== 'all') params.append('track', filterTrack)
      if (filterLevel !== 'all') params.append('level', filterLevel)
      const url = `/curriculum/modules/${params.toString() ? `?${params}` : ''}`
      const data = await apiGateway.get(url) as any
      setModules(data?.results || data?.data || data || [])
    } catch (error) {
      console.error('Failed to fetch modules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLessons = async (moduleId: string) => {
    try {
      const data = await apiGateway.get(`/curriculum/lessons/?module=${moduleId}`) as any
      const lessons = data?.results || data?.data || data || []
      setModuleLessons(prev => ({ ...prev, [moduleId]: lessons }))
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
    }
  }

  const toggleExpand = (module: CurriculumModule) => {
    if (expandedModuleId === module.id) {
      setExpandedModuleId(null)
    } else {
      setExpandedModuleId(module.id)
      if (!moduleLessons[module.id]) {
        fetchLessons(module.id)
      }
    }
  }

  const handleDeleteModule = async (module: CurriculumModule) => {
    if (!window.confirm(`Delete module "${module.title}" and all its lessons? This cannot be undone.`)) return
    setDeletingModuleId(module.id)
    try {
      await apiGateway.delete(`/curriculum/modules/${module.id}/`)
      setExpandedModuleId(prev => (prev === module.id ? null : prev))
      setModuleLessons(prev => {
        const next = { ...prev }
        delete next[module.id]
        return next
      })
      await fetchModules()
    } catch (error) {
      console.error('Failed to delete module:', error)
    } finally {
      setDeletingModuleId(null)
    }
  }

  const handleDeleteLesson = async (moduleId: string, lesson: Lesson) => {
    if (!window.confirm(`Delete lesson "${lesson.title}"? This cannot be undone.`)) return
    setDeletingLessonId(lesson.id)
    try {
      await apiGateway.delete(`/curriculum/lessons/${lesson.id}/`)
      await fetchLessons(moduleId)
      await fetchModules()
    } catch (error) {
      console.error('Failed to delete lesson:', error)
    } finally {
      setDeletingLessonId(null)
    }
  }

  const trackInfo = (slug: string) => {
    const track = tracks.find(t => t.slug === slug)
    return track ? {
      slug: track.slug,
      label: track.name,
      color: TRACK_COLORS[track.slug] || 'bg-slate-600'
    } : { slug, label: slug, color: 'bg-slate-600' }
  }
  const levelInfo = (key: string) => LEVELS.find(l => l.key === key) || { key, label: key, tier: '' }

  return (
    <RouteGuard requiredRoles={['program_director', 'admin']}>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Curriculum Modules</h1>
              <p className="text-och-steel text-sm">
                Manage learning modules linked to tracks and levels — these appear in student learning paths
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModule(true)}
              variant="defender"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Module
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div>
              <label className="text-xs text-och-steel block mb-1">Track</label>
              <select
                value={filterTrack}
                onChange={e => setFilterTrack(e.target.value)}
                className="px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
              >
                <option value="all">All Tracks</option>
                {tracks.map(t => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-och-steel block mb-1">Level</label>
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
                className="px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
              >
                <option value="all">All Levels</option>
                {LEVELS.map(l => (
                  <option key={l.key} value={l.key}>{l.label} ({l.tier})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Module Count Summary */}
          {!isLoading && tracks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tracks.map(t => {
                const count = modules.filter(m => m.track_key === t.slug).length
                const color = TRACK_COLORS[t.slug] || 'bg-slate-600'
                return count > 0 ? (
                  <span key={t.slug} className={`text-xs px-3 py-1 rounded-full text-white ${color}`}>
                    {t.name}: {count} module{count !== 1 ? 's' : ''}
                  </span>
                ) : null
              })}
            </div>
          )}

          {/* Module List */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender" />
            </div>
          ) : modules.length === 0 ? (
            <Card className="border-och-steel/20 bg-och-midnight/50">
              <div className="p-12 text-center">
                <p className="text-och-steel mb-2 text-lg">No modules found</p>
                <p className="text-och-steel/70 mb-6 text-sm">
                  Create your first curriculum module to start building the student learning path
                </p>
                <Button onClick={() => setShowCreateModule(true)} variant="defender">
                  Create First Module
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {modules.map(module => {
                const track = trackInfo(module.track_key)
                const level = levelInfo(module.level)
                const isExpanded = expandedModuleId === module.id
                const lessons = moduleLessons[module.id] || []

                return (
                  <Card key={module.id} className="border-och-steel/20 bg-och-midnight/50">
                    <div className="p-4">
                      {/* Module header row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Track + Level badges */}
                          <div className="flex flex-col gap-1 pt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded text-white font-semibold ${track.color}`}>
                              {track.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-center">
                              {level.label}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-och-steel/60 text-xs">#{module.order_index}</span>
                              <h3 className="text-white font-semibold">{module.title}</h3>
                              {module.is_core && (
                                <span className="text-xs bg-och-defender/20 text-och-mint px-2 py-0.5 rounded">Core</span>
                              )}
                            </div>
                            {module.description && (
                              <p className="text-sm text-och-steel mt-1 line-clamp-1">{module.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-och-steel/70">
                              <span>{module.lesson_count} lesson{module.lesson_count !== 1 ? 's' : ''}</span>
                              {module.mission_count > 0 && <span>{module.mission_count} mission{module.mission_count !== 1 ? 's' : ''}</span>}
                              {module.estimated_time_minutes && <span>{module.estimated_time_minutes} min</span>}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddLessonToModule(module)}
                            className="text-xs border-och-steel/50 text-och-steel hover:border-och-mint hover:text-och-mint"
                          >
                            + Lesson
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteModule(module)}
                            disabled={!!deletingModuleId}
                            className="text-xs border-red-500/50 text-red-400 hover:border-red-500 hover:bg-red-500/10"
                            title="Delete module and all lessons"
                          >
                            {deletingModuleId === module.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                          <button
                            onClick={() => toggleExpand(module)}
                            className="text-och-steel hover:text-white transition-colors p-1"
                          >
                            <svg
                              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded lessons */}
                      {isExpanded && (
                        <div className="mt-4 border-t border-och-steel/20 pt-4">
                          <p className="text-xs text-och-steel mb-3">Lessons in this module:</p>
                          {lessons.length === 0 ? (
                            <p className="text-xs text-och-steel/50 italic">
                              No lessons yet — click "+ Lesson" to add one
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {lessons.map((lesson, idx) => (
                                <div key={lesson.id} className="flex items-center gap-3 bg-och-midnight/80 rounded-lg px-3 py-2">
                                  <span className="text-xs text-och-steel/50 w-5">{idx + 1}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    lesson.lesson_type === 'video' ? 'bg-blue-500/20 text-blue-300' :
                                    lesson.lesson_type === 'quiz' ? 'bg-yellow-500/20 text-yellow-300' :
                                    lesson.lesson_type === 'lab' ? 'bg-green-500/20 text-green-300' :
                                    'bg-slate-700 text-slate-300'
                                  }`}>
                                    {lesson.lesson_type}
                                  </span>
                                  <span className="text-sm text-white flex-1">{lesson.title}</span>
                                  {lesson.duration_minutes && (
                                    <span className="text-xs text-och-steel/50">{lesson.duration_minutes}m</span>
                                  )}
                                  {lesson.content_url && (
                                    <a
                                      href={lesson.content_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-och-defender hover:underline"
                                    >
                                      View
                                    </a>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLesson(module.id, lesson)}
                                    disabled={!!deletingLessonId}
                                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 min-w-0 h-7"
                                    title="Delete lesson"
                                  >
                                    {deletingLessonId === lesson.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Create Module Modal */}
        {showCreateModule && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-och-midnight border border-och-steel/20 rounded-lg shadow-xl">
              <CreateModuleForm
                tracks={tracks}
                onClose={() => setShowCreateModule(false)}
                onSuccess={() => { setShowCreateModule(false); fetchModules() }}
              />
            </div>
          </div>
        )}

        {/* Add Lesson Modal */}
        {addLessonToModule && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-och-midnight border border-och-steel/20 rounded-lg shadow-xl">
              <AddLessonForm
                module={addLessonToModule}
                tracks={tracks}
                onClose={() => setAddLessonToModule(null)}
                onSuccess={() => {
                  fetchLessons(addLessonToModule.id)
                  fetchModules()
                  setAddLessonToModule(null)
                  setExpandedModuleId(addLessonToModule.id)
                }}
              />
            </div>
          </div>
        )}
      </DirectorLayout>
    </RouteGuard>
  )
}

// --- Create Module Form ---

function CreateModuleForm({ tracks, onClose, onSuccess }: { tracks: Track[]; onClose: () => void; onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    track_key: tracks.length > 0 ? tracks[0].slug : 'defender',
    level: 'beginner',
    title: '',
    description: '',
    order_index: 1,
    estimated_time_minutes: 30,
    is_core: true,
    is_required: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await apiGateway.post('/curriculum/modules/', form)
      onSuccess()
    } catch (error) {
      console.error('Failed to create module:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const field = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Create Module</h2>
          <p className="text-och-steel text-sm mt-1">Module will appear in the student learning path</p>
        </div>
        <button onClick={onClose} className="text-och-steel hover:text-white p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Track + Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-och-steel mb-1">Track *</label>
            <select
              value={form.track_key}
              onChange={e => field('track_key', e.target.value)}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
            >
              {tracks.map(t => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-och-steel mb-1">Level *</label>
            <select
              value={form.level}
              onChange={e => field('level', e.target.value)}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
            >
              {LEVELS.map(l => (
                <option key={l.key} value={l.key}>{l.label} ({l.tier})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-och-steel mb-1">Module Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => field('title', e.target.value)}
            placeholder="e.g. Introduction to SOC Monitoring"
            required
            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-och-steel mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => field('description', e.target.value)}
            placeholder="What will students learn in this module?"
            rows={3}
            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
          />
        </div>

        {/* Order + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-och-steel mb-1">Order *</label>
            <input
              type="number"
              value={form.order_index}
              onChange={e => field('order_index', parseInt(e.target.value) || 1)}
              min="1"
              required
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-och-steel mb-1">Est. Duration (minutes)</label>
            <input
              type="number"
              value={form.estimated_time_minutes}
              onChange={e => field('estimated_time_minutes', parseInt(e.target.value) || 30)}
              min="1"
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
            />
          </div>
        </div>

        {/* Flags */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_core}
              onChange={e => field('is_core', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-sm text-och-steel">Core module</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_required}
              onChange={e => field('is_required', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-sm text-och-steel">Required to complete level</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="defender" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Module'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// --- Add Lesson Form ---

function AddLessonForm({
  module,
  tracks,
  onClose,
  onSuccess,
}: {
  module: CurriculumModule
  tracks: Track[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    lesson_type: 'video',
    content_url: '',
    description: '',
    duration_minutes: 10,
    order_index: 1,
    is_required: true,
  })

  const field = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setUploadedUrl('')
    setUploadProgress('idle')
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploadProgress('uploading')
    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      const result = await apiGateway.post('/curriculum/lessons/upload-video/', formData) as any
      setUploadedUrl(result.url)
      setUploadProgress('done')
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadProgress('error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const contentUrl = uploadMode === 'file' ? uploadedUrl : form.content_url
    if (uploadMode === 'file' && !uploadedUrl) {
      alert('Please upload the video file first.')
      return
    }
    setIsLoading(true)
    try {
      await apiGateway.post('/curriculum/lessons/', {
        ...form,
        content_url: contentUrl,
        module: module.id,
      })
      onSuccess()
    } catch (error) {
      console.error('Failed to add lesson:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const track = tracks.find(t => t.slug === module.track_key)
  const level = LEVELS.find(l => l.key === module.level)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Add Lesson</h2>
          <p className="text-och-steel text-xs mt-1">
            {track?.name} · {level?.label} · {module.title}
          </p>
        </div>
        <button onClick={onClose} className="text-och-steel hover:text-white p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type + Order */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-och-steel mb-1">Lesson Type *</label>
            <select
              value={form.lesson_type}
              onChange={e => field('lesson_type', e.target.value)}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
            >
              {LESSON_TYPES.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-och-steel mb-1">Order</label>
            <input
              type="number"
              value={form.order_index}
              onChange={e => field('order_index', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-och-steel mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => field('title', e.target.value)}
            placeholder="e.g. Introduction to SIEM Tools"
            required
            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
          />
        </div>

        {/* Video / Content source — URL or Upload */}
        {form.lesson_type === 'video' && (
          <div>
            <label className="block text-sm font-medium text-och-steel mb-2">Video Source</label>

            {/* Toggle */}
            <div className="flex rounded-lg border border-och-steel/30 overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 py-2 text-sm transition-colors ${
                  uploadMode === 'url'
                    ? 'bg-och-defender text-white'
                    : 'bg-och-midnight text-och-steel hover:text-white'
                }`}
              >
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 text-sm transition-colors ${
                  uploadMode === 'file'
                    ? 'bg-och-defender text-white'
                    : 'bg-och-midnight text-och-steel hover:text-white'
                }`}
              >
                Upload File
              </button>
            </div>

            {uploadMode === 'url' ? (
              <input
                type="url"
                value={form.content_url}
                onChange={e => field('content_url', e.target.value)}
                placeholder="https://youtube.com/... or https://vimeo.com/..."
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
              />
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-och-steel/30 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="video-upload-input"
                  />
                  <label htmlFor="video-upload-input" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="text-sm">
                        <p className="text-white font-medium">{selectedFile.name}</p>
                        <p className="text-och-steel text-xs mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-och-steel">
                        <svg className="w-8 h-8 mx-auto mb-2 text-och-steel/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p>Click to select video file</p>
                        <p className="text-xs text-och-steel/50 mt-1">MP4, WebM, MOV, AVI supported</p>
                      </div>
                    )}
                  </label>
                </div>

                {selectedFile && uploadProgress !== 'done' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUpload}
                    disabled={uploadProgress === 'uploading'}
                    className="w-full border-och-defender text-och-defender hover:bg-och-defender hover:text-white"
                  >
                    {uploadProgress === 'uploading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                      </span>
                    ) : 'Upload to Server'}
                  </Button>
                )}

                {uploadProgress === 'done' && (
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Uploaded successfully
                  </p>
                )}
                {uploadProgress === 'error' && (
                  <p className="text-red-400 text-sm">Upload failed — please try again</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content URL for non-video types */}
        {form.lesson_type !== 'video' && (
          <div>
            <label className="block text-sm font-medium text-och-steel mb-1">Content URL</label>
            <input
              type="url"
              value={form.content_url}
              onChange={e => field('content_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
            />
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-och-steel mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={form.duration_minutes}
            onChange={e => field('duration_minutes', parseInt(e.target.value) || 1)}
            min="1"
            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white text-sm focus:border-och-defender focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="defender"
            disabled={isLoading || (uploadMode === 'file' && form.lesson_type === 'video' && uploadProgress !== 'done')}
          >
            {isLoading ? 'Adding...' : 'Add Lesson'}
          </Button>
        </div>
      </form>
    </div>
  )
}
