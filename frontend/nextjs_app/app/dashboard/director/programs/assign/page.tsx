'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { usePrograms, useUpdateCohortDirector } from '@/hooks/usePrograms'
import { programsClient } from '@/services/programsClient'

export default function AssignCohortPage() {
  const { programs, isLoading } = usePrograms()
  const { updateCohort, isLoading: isAssigning, error: assignApiError } = useUpdateCohortDirector()
  const [programDetails, setProgramDetails] = useState<Record<string, any>>({})
  
  const [assignProgramId, setAssignProgramId] = useState<string>('')
  const [assignTrackId, setAssignTrackId] = useState<string>('')
  const [assignCohortId, setAssignCohortId] = useState<string>('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)
  const [cohortSearchQuery, setCohortSearchQuery] = useState('')
  const [showCohortDropdown, setShowCohortDropdown] = useState(false)
  const [allCohorts, setAllCohorts] = useState<any[]>([])

  const fetchProgramTracks = useCallback(async (programId: string) => {
    if (!programId) return
    try {
      const tracks = await programsClient.getTracks(programId)
      setProgramDetails(prev => ({
        ...prev,
        [programId]: { tracks: Array.isArray(tracks) ? tracks : [] }
      }))
    } catch (err) {
      console.error('Failed to fetch tracks:', err)
    }
  }, [])

  useEffect(() => {
    const loadCohorts = async () => {
      try {
        const response = await programsClient.getCohorts({ page: 1, pageSize: 1000 })
        const cohorts = Array.isArray(response) ? response : (response.results || [])
        setAllCohorts(cohorts)
      } catch (err) {
        console.error('Failed to load cohorts:', err)
      }
    }
    loadCohorts()
  }, [])

  const assignTracks = useMemo(() => {
    if (!assignProgramId) return []
    const details = programDetails[assignProgramId]
    return details?.tracks || []
  }, [assignProgramId, programDetails])

  const filteredCohorts = useMemo(() => {
    const q = cohortSearchQuery.trim().toLowerCase()
    if (!q) return allCohorts
    return allCohorts.filter((c) => {
      const hay = `${c.name} ${c.track_name || ''} ${c.status || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [allCohorts, cohortSearchQuery])

  const handleAssign = async () => {
    setAssignError(null)
    setAssignSuccess(null)

    if (!assignProgramId || !assignTrackId || !assignCohortId) {
      setAssignError('Please select a program, track, and cohort.')
      return
    }

    try {
      await updateCohort(assignCohortId, { track: assignTrackId })
      setAssignSuccess('Cohort assigned to track successfully.')
      
      setTimeout(() => {
        setAssignProgramId('')
        setAssignTrackId('')
        setAssignCohortId('')
        setCohortSearchQuery('')
        setShowCohortDropdown(false)
        setAssignSuccess(null)
      }, 2000)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail || 
                          err?.response?.data?.track?.[0] ||
                          err?.message || 
                          'Failed to assign cohort to track'
      setAssignError(errorMessage)
    }
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">Assign Cohort to Track</h1>
            <p className="text-och-steel">Link cohorts to programs by assigning them to tracks</p>
          </div>

          <Card className="border-och-defender/30 bg-gradient-to-r from-och-defender/5 to-transparent">
            <div className="p-8">
              {(assignError || assignApiError) && (
                <div className="mb-6 p-4 rounded-lg border border-och-orange/50 bg-och-orange/10 text-och-orange">
                  {assignError || assignApiError}
                </div>
              )}
              {assignSuccess && (
                <div className="mb-6 p-4 rounded-lg border border-och-mint/50 bg-och-mint/10 text-och-mint">
                  {assignSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">Program</label>
                  <select
                    value={assignProgramId}
                    onChange={(e) => {
                      setAssignProgramId(e.target.value)
                      setAssignTrackId('')
                      setAssignError(null)
                      setAssignSuccess(null)
                      if (e.target.value) fetchProgramTracks(e.target.value)
                    }}
                    className="w-full px-4 py-3 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="">Select a program...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">Track</label>
                  <select
                    value={assignTrackId}
                    onChange={(e) => {
                      setAssignTrackId(e.target.value)
                      setAssignError(null)
                    }}
                    disabled={!assignProgramId || !programDetails[assignProgramId]}
                    className="w-full px-4 py-3 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender disabled:opacity-50"
                  >
                    <option value="">
                      {!assignProgramId ? 'Select program first' : assignTracks.length === 0 ? 'No tracks available' : 'Select a track...'}
                    </option>
                    {assignTracks.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-white mb-3">Cohort</label>
                  <input
                    type="text"
                    value={cohortSearchQuery}
                    onChange={(e) => {
                      setCohortSearchQuery(e.target.value)
                      setShowCohortDropdown(true)
                      setAssignCohortId('')
                    }}
                    onFocus={() => setShowCohortDropdown(true)}
                    placeholder="Search cohorts..."
                    className="w-full px-4 py-3 bg-och-midnight/70 border border-och-steel/30 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  />
                  {showCohortDropdown && filteredCohorts.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-och-midnight border border-och-steel/30 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {filteredCohorts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setAssignCohortId(c.id)
                            setCohortSearchQuery(c.name)
                            setShowCohortDropdown(false)
                          }}
                          className="px-4 py-3 cursor-pointer hover:bg-och-midnight/80 transition-colors border-b border-och-steel/10 last:border-0"
                        >
                          <div className="font-medium text-white">{c.name}</div>
                          <div className="text-sm text-och-steel mt-1">
                            {c.track_name || `Track: ${c.track}`} • {c.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssignProgramId('')
                    setAssignTrackId('')
                    setAssignCohortId('')
                    setCohortSearchQuery('')
                    setShowCohortDropdown(false)
                  }}
                  disabled={isAssigning}
                >
                  Reset
                </Button>
                <Button
                  variant="defender"
                  onClick={handleAssign}
                  disabled={isAssigning || !assignProgramId || !assignTrackId || !assignCohortId}
                >
                  {isAssigning ? 'Assigning...' : 'Assign Cohort'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DirectorLayout>
    </RouteGuard>
  )
}