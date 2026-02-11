'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { missionsClient } from '@/services/missionsClient'
import { useTracks } from '@/hooks/usePrograms'
import { ArrowLeft } from 'lucide-react'

export default function EditMissionPage() {
  const params = useParams()
  const router = useRouter()
  const missionId = params.id as string
  const { tracks } = useTracks()
  const trackList = useMemo(() => (Array.isArray(tracks) ? tracks : []), [tracks])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 1,
    mission_type: 'intermediate',
    requires_mentor_review: false,
    requires_lab_integration: false,
    estimated_duration_min: 60,
    skills_tags: '',
    track_id: '',
    subtasks: [] as Array<{
      id: number
      title: string
      description: string
      order_index: number
      is_required: boolean
    }>,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const raw = await missionsClient.getMission(missionId)
        if (cancelled) return
        const m = raw as Record<string, unknown>
        const subtasksRaw = (m.subtasks as Array<Record<string, unknown>>) ?? []
        const subtasks = subtasksRaw.map((s, i) => ({
          id: i + 1,
          title: String(s.title ?? s.name ?? ''),
          description: String(s.description ?? ''),
          order_index: Number(s.order_index ?? s.order ?? i + 1),
          is_required: (s.is_required ?? s.required ?? true) as boolean,
        }))
        setFormData({
          title: String(m.title ?? m.code ?? ''),
          description: String(m.description ?? ''),
          difficulty: typeof m.difficulty === 'number' ? m.difficulty : 2,
          mission_type: String(m.mission_type ?? m.type ?? 'intermediate'),
          requires_mentor_review: (m.requires_mentor_review ?? false) as boolean,
          requires_lab_integration: (m.requires_lab_integration ?? false) as boolean,
          estimated_duration_min: Number(m.estimated_duration_min ?? m.estimated_time_minutes ?? 60),
          skills_tags: Array.isArray(m.skills_tags) ? (m.skills_tags as string[]).join(', ') : String(m.skills_tags ?? ''),
          track_id: String(m.track_id ?? ''),
          subtasks,
        })
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load mission')
      }
    }
    load()
    return () => { cancelled = true }
  }, [missionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError('')
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        mission_type: formData.mission_type,
        requires_mentor_review: formData.requires_mentor_review,
        requires_lab_integration: formData.requires_lab_integration,
        estimated_duration_min: formData.estimated_duration_min,
        skills_tags: formData.skills_tags.split(',').map((s) => s.trim()).filter(Boolean),
        track_id: formData.track_id || undefined,
        subtasks: formData.subtasks,
      }
      await missionsClient.updateMission(missionId, payload)
      router.push(`/dashboard/director/missions/${missionId}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update mission')
    } finally {
      setLoading(false)
    }
  }

  if (loadError) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="p-6 border-och-orange/50">
            <p className="text-och-orange mb-4">{loadError}</p>
            <Link href="/dashboard/director/missions">
              <Button variant="outline">← Back to Missions</Button>
            </Link>
          </Card>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/director/missions/${missionId}`}>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Mission</h1>
              <p className="text-och-steel">Update mission details</p>
            </div>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-4 bg-och-orange/20 border border-och-orange/50 rounded-lg">
                  <p className="text-och-orange text-sm">{submitError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">Mission Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Network Security Fundamentals"
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the mission objectives and learning outcomes"
                  rows={4}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Difficulty (1-5)</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  >
                    <option value={1}>1 - Beginner</option>
                    <option value={2}>2 - Intermediate</option>
                    <option value={3}>3 - Advanced</option>
                    <option value={4}>4 - Expert</option>
                    <option value={5}>5 - Master</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Mission Type</label>
                  <select
                    value={formData.mission_type}
                    onChange={(e) => setFormData({ ...formData, mission_type: e.target.value })}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="capstone">Capstone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.estimated_duration_min}
                    onChange={(e) => setFormData({ ...formData, estimated_duration_min: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Track (optional)</label>
                  <select
                    value={formData.track_id}
                    onChange={(e) => setFormData({ ...formData, track_id: e.target.value })}
                    className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-mint focus:outline-none"
                  >
                    <option value="">Select a track (optional)</option>
                    {trackList.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name} ({t.key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Skills Tags</label>
                <input
                  type="text"
                  value={formData.skills_tags}
                  onChange={(e) => setFormData({ ...formData, skills_tags: e.target.value })}
                  placeholder="network-security, incident-response (comma-separated)"
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-white">Mission Subtasks</label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        subtasks: [
                          ...formData.subtasks,
                          {
                            id: formData.subtasks.length + 1,
                            title: '',
                            description: '',
                            order_index: formData.subtasks.length + 1,
                            is_required: true,
                          },
                        ],
                      })
                    }}
                  >
                    + Add Subtask
                  </Button>
                </div>
                {formData.subtasks.length === 0 ? (
                  <p className="text-och-steel text-sm italic">No subtasks. Click &quot;Add Subtask&quot; to add objectives.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.subtasks.map((subtask, index) => (
                      <div key={subtask.id} className="p-4 bg-och-midnight/50 border border-och-steel/30 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-och-mint">Subtask {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.subtasks.filter((_, i) => i !== index)
                              updated.forEach((s, i) => {
                                s.id = i + 1
                                s.order_index = i + 1
                              })
                              setFormData({ ...formData, subtasks: updated })
                            }}
                            className="text-och-orange hover:text-och-orange/80 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={subtask.title}
                          onChange={(e) => {
                            const updated = [...formData.subtasks]
                            updated[index] = { ...updated[index], title: e.target.value }
                            setFormData({ ...formData, subtasks: updated })
                          }}
                          placeholder="Subtask title"
                          className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none"
                        />
                        <textarea
                          value={subtask.description}
                          onChange={(e) => {
                            const updated = [...formData.subtasks]
                            updated[index] = { ...updated[index], description: e.target.value }
                            setFormData({ ...formData, subtasks: updated })
                          }}
                          placeholder="Subtask description"
                          rows={2}
                          className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel/50 focus:border-och-mint focus:outline-none resize-none"
                        />
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`subtask_required_${index}`}
                            checked={subtask.is_required}
                            onChange={(e) => {
                              const updated = [...formData.subtasks]
                              updated[index] = { ...updated[index], is_required: e.target.checked }
                              setFormData({ ...formData, subtasks: updated })
                            }}
                            className="w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2"
                          />
                          <label htmlFor={`subtask_required_${index}`} className="ml-2 text-sm text-white">
                            Required
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mentor_review"
                    checked={formData.requires_mentor_review}
                    onChange={(e) => setFormData({ ...formData, requires_mentor_review: e.target.checked })}
                    className="w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2"
                  />
                  <label htmlFor="mentor_review" className="ml-2 text-sm text-white">
                    Requires Mentor Review ($7 tier)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="lab_integration"
                    checked={formData.requires_lab_integration}
                    onChange={(e) => setFormData({ ...formData, requires_lab_integration: e.target.checked })}
                    className="w-4 h-4 text-och-mint bg-och-midnight border-och-steel/30 rounded focus:ring-och-mint focus:ring-2"
                  />
                  <label htmlFor="lab_integration" className="ml-2 text-sm text-white">
                    Requires Lab Integration
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Link href={`/dashboard/director/missions/${missionId}`}>
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="defender" disabled={loading}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
