'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { missionsClient } from '@/services/missionsClient'
import { programsClient, type Cohort } from '@/services/programsClient'
import Link from 'next/link'
import { Plus, Target, Clock, Star, Users, Eye, Pencil } from 'lucide-react'

interface AssignedCohort {
  cohort_id: string
  cohort_name: string
}

interface Mission {
  id: string
  title: string
  description: string
  difficulty: number
  mission_type: string
  estimated_duration_min: number
  is_active: boolean
  created_at: string
  assigned_cohorts?: AssignedCohort[]
}

function normalizeMission(m: Record<string, unknown>): Mission {
  const rawCohorts = (m.assigned_cohorts as AssignedCohort[] | undefined) ?? []
  return {
    id: String(m.id ?? ''),
    title: String(m.title ?? m.code ?? ''),
    description: String(m.description ?? ''),
    difficulty: typeof m.difficulty === 'number' ? m.difficulty : (m.difficulty === 'advanced' ? 3 : m.difficulty === 'intermediate' ? 2 : 1),
    mission_type: String(m.mission_type ?? m.type ?? 'lab'),
    estimated_duration_min: Number(m.estimated_duration_min ?? m.estimated_time_minutes ?? 0),
    is_active: (m.status === 'published' || m.status === 'active' || m.is_active) === true,
    created_at: String(m.created_at ?? ''),
    assigned_cohorts: Array.isArray(rawCohorts) ? rawCohorts : [],
  }
}

export default function MissionsPage() {
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [assignMissionId, setAssignMissionId] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohortIds, setSelectedCohortIds] = useState<Set<string>>(new Set())
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchMissions()
  }, [])

  const fetchMissions = async () => {
    try {
      const { results } = await missionsClient.getAllMissionsAdmin()
      setMissions((results as Record<string, unknown>[]).map(normalizeMission))
    } catch (err) {
      console.error('Failed to fetch missions:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAssignModal = async (missionId: string) => {
    setAssignMissionId(missionId)
    setSelectedCohortIds(new Set())
    setAssignError(null)
    setAssignSuccess(null)
    setShowAssignModal(true)
    try {
      const { results } = await programsClient.getCohorts()
      setCohorts(results)
    } catch (err) {
      console.error('Failed to load cohorts:', err)
      setAssignError('Failed to load cohorts.')
    }
  }

  const toggleCohort = (cohortId: string) => {
    setSelectedCohortIds(prev => {
      const next = new Set(prev)
      if (next.has(cohortId)) next.delete(cohortId)
      else next.add(cohortId)
      return next
    })
  }

  const handleAssignToCohorts = async () => {
    if (!assignMissionId || selectedCohortIds.size === 0) {
      setAssignError('Select at least one cohort.')
      return
    }
    setAssignError(null)
    setAssignLoading(true)
    try {
      await Promise.all(
        Array.from(selectedCohortIds).map(cohortId =>
          missionsClient.assignMissionToCohort(assignMissionId, cohortId)
        )
      )
      setAssignSuccess(`Assigned to ${selectedCohortIds.size} cohort(s).`)
      setShowAssignModal(false)
      setAssignMissionId(null)
      setSelectedCohortIds(new Set())
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign mission to cohorts.')
    } finally {
      setAssignLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: 'text-green-400',
      2: 'text-blue-400', 
      3: 'text-yellow-400',
      4: 'text-orange-400',
      5: 'text-red-400'
    }
    return colors[difficulty as keyof typeof colors] || 'text-och-steel'
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Missions</h1>
              <p className="text-och-steel">Manage curriculum missions</p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/director/missions/new')}
              variant="defender"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Mission
            </Button>
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-och-steel">Loading missions...</p>
            </Card>
          ) : missions.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 text-och-steel mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No missions yet</h3>
              <p className="text-och-steel mb-4">Create your first mission to get started</p>
              <Button
                onClick={() => router.push('/dashboard/director/missions/new')}
                variant="defender"
              >
                Create Mission
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {missions.map((mission) => (
                <Card key={mission.id} className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">{mission.title}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(mission.difficulty)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${getDifficultyColor(mission.difficulty)}`} />
                          ))}
                        </div>
                        <span className="px-2 py-1 bg-och-steel/20 text-och-steel text-xs rounded">
                          {mission.mission_type}
                        </span>
                      </div>
                      <p className="text-och-steel text-sm mb-3 line-clamp-2">{mission.description}</p>
                      <div className="flex items-center gap-4 text-xs text-och-steel mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mission.estimated_duration_min} min
                        </div>
                        <div className={`px-2 py-1 rounded ${mission.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {mission.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      {mission.assigned_cohorts && mission.assigned_cohorts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-xs text-och-steel">Assigned to:</span>
                          {mission.assigned_cohorts.map((c) => (
                            <Link
                              key={c.cohort_id}
                              href={`/dashboard/director/cohorts/${c.cohort_id}`}
                              className="text-xs px-2 py-0.5 rounded bg-och-defender/20 text-och-defender hover:bg-och-defender/30"
                            >
                              {c.cohort_name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Link href={`/dashboard/director/missions/${mission.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                          <Eye className="w-3.5 h-3.5" />
                          View details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/director/missions/${mission.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 w-full sm:w-auto"
                        onClick={() => openAssignModal(mission.id)}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Assign to cohorts
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
            <DialogContent className="max-w-md border-och-steel/20 bg-och-midnight">
              <DialogHeader>
                <DialogTitle className="text-white">Assign mission to cohorts</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {assignError && (
                  <p className="text-sm text-red-400" role="alert">{assignError}</p>
                )}
                {assignSuccess && (
                  <p className="text-sm text-och-mint" role="status">{assignSuccess}</p>
                )}
                <p className="text-sm text-och-steel">Select one or more cohorts:</p>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-och-steel/20 rounded-lg p-2">
                  {cohorts.length === 0 && !assignError && (
                    <p className="text-sm text-och-steel">Loading cohorts…</p>
                  )}
                  {cohorts.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-och-steel/10"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCohortIds.has(c.id)}
                        onChange={() => toggleCohort(c.id)}
                        className="rounded border-och-steel/40 text-och-defender focus:ring-och-defender"
                      />
                      <span className="text-sm text-white">{c.name}</span>
                      <span className="text-xs text-och-steel">{c.status}</span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="defender"
                  onClick={handleAssignToCohorts}
                  disabled={assignLoading || selectedCohortIds.size === 0}
                >
                  {assignLoading ? 'Assigning…' : 'Assign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}