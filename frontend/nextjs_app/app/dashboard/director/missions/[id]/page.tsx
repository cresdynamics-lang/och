'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { missionsClient } from '@/services/missionsClient'
import { Target, Clock, Star, Pencil, ArrowLeft, Users } from 'lucide-react'

interface AssignedCohort {
  cohort_id: string
  cohort_name: string
}

interface MissionDetail {
  id: string
  title: string
  description: string
  difficulty: number
  mission_type: string
  estimated_duration_min: number
  is_active: boolean
  assigned_cohorts?: AssignedCohort[]
}

function getDifficultyColor(difficulty: number) {
  const colors: Record<number, string> = {
    1: 'text-green-400',
    2: 'text-blue-400',
    3: 'text-yellow-400',
    4: 'text-orange-400',
    5: 'text-red-400',
  }
  return colors[difficulty] ?? 'text-och-steel'
}

export default function MissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const missionId = params.id as string
  const [mission, setMission] = useState<MissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const raw = await missionsClient.getMission(missionId)
        if (cancelled) return
        const m = raw as Record<string, unknown>
        const cohorts = (m.assigned_cohorts as AssignedCohort[] | undefined) ?? []
        setMission({
          id: String(m.id ?? ''),
          title: String(m.title ?? m.code ?? ''),
          description: String(m.description ?? ''),
          difficulty: typeof m.difficulty === 'number' ? m.difficulty : 2,
          mission_type: String(m.mission_type ?? m.type ?? 'intermediate'),
          estimated_duration_min: Number(m.estimated_duration_min ?? m.estimated_time_minutes ?? 0),
          is_active: (m.is_active ?? m.status === 'published') === true,
          assigned_cohorts: Array.isArray(cohorts) ? cohorts : [],
        })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load mission')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [missionId])

  if (loading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4" />
              <p className="text-och-steel">Loading mission...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  if (error || !mission) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <Card className="p-6 border-och-orange/50">
            <p className="text-och-orange mb-4">{error ?? 'Mission not found'}</p>
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
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/director/missions">
                <Button variant="outline" size="sm" className="gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <Link href={`/dashboard/director/missions/${missionId}/edit`}>
                <Button variant="defender" size="sm" className="gap-1">
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-2xl font-bold text-white">{mission.title}</h1>
              <div className="flex items-center gap-1">
                {[...Array(mission.difficulty)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${getDifficultyColor(mission.difficulty)}`} />
                ))}
              </div>
              <span className="px-2 py-1 bg-och-steel/20 text-och-steel text-xs rounded capitalize">
                {mission.mission_type}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  mission.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {mission.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-och-steel mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {mission.estimated_duration_min} min
              </span>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-och-steel whitespace-pre-wrap">{mission.description}</p>
            </div>
            {mission.assigned_cohorts && mission.assigned_cohorts.length > 0 && (
              <div className="mt-6 pt-4 border-t border-och-steel/20">
                <h3 className="text-sm font-medium text-och-steel mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assigned to cohorts
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[...new Map(mission.assigned_cohorts.map((c) => [c.cohort_id, c])).values()].map((c) => (
                    <Link
                      key={c.cohort_id}
                      href={`/dashboard/director/cohorts/${c.cohort_id}`}
                      className="text-sm px-3 py-1.5 rounded bg-och-defender/20 text-och-defender hover:bg-och-defender/30"
                    >
                      {c.cohort_name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}
