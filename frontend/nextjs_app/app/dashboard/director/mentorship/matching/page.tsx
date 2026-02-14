'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohorts, useTracks } from '@/hooks/usePrograms'
import { programsClient, type MentorAssignment, type TrackMentorAssignment, type CurriculumTrackMentorAssignment } from '@/services/programsClient'
import { useUsers } from '@/hooks/useUsers'
import { apiGateway } from '@/services/apiGateway'

type AssignmentMode = 'cohort' | 'track' | 'direct'

/** Curriculum track (same as Director Tracks page); used for "Assign to track" so lists match. */
interface CurriculumTrackForMatching {
  id: string
  slug: string
  name: string
  title?: string
  code: string
  description?: string
  level?: string
  tier?: number
  order_number?: number
  program_track_id?: string | null
  is_active?: boolean
}

function normalizeMentorList(raw: unknown): MentorAssignment[] {
  if (Array.isArray(raw)) return raw as MentorAssignment[]
  const o = raw as { results?: unknown[]; data?: unknown[] }
  if (Array.isArray(o?.results)) return o.results as MentorAssignment[]
  if (Array.isArray(o?.data)) return o.data as MentorAssignment[]
  return []
}

export default function MentorshipMatchingPage() {
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })
  const { tracks } = useTracks()
  const { users: mentorsFromApi } = useUsers({ page: 1, page_size: 200, role: 'mentor' })
  const { users: studentsFromApi } = useUsers({ page: 1, page_size: 500, role: 'student' })
  const mentors = useMemo(() => mentorsFromApi || [], [mentorsFromApi])
  const students = useMemo(() => studentsFromApi || [], [studentsFromApi])

  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('cohort')
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>([])
  const [cohortSearch, setCohortSearch] = useState('')
  const [assignmentsByCohort, setAssignmentsByCohort] = useState<Record<string, MentorAssignment[]>>({})
  const [mentorCohortNames, setMentorCohortNames] = useState<Record<string, string[]>>({})
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [autoMatching, setAutoMatching] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'primary' | 'support' | 'guest'>('support')
  const [message, setMessage] = useState<string | null>(null)

  // Track assignment state (uses curriculum tracks; both program-linked and curriculum-only)
  const [curriculumTracks, setCurriculumTracks] = useState<CurriculumTrackForMatching[]>([])
  const [curriculumTracksLoading, setCurriculumTracksLoading] = useState(true)
  const [selectedProgramTrackIds, setSelectedProgramTrackIds] = useState<string[]>([])
  const [selectedCurriculumTrackIds, setSelectedCurriculumTrackIds] = useState<string[]>([])
  const [trackSearch, setTrackSearch] = useState('')
  const [assignmentsByTrack, setAssignmentsByTrack] = useState<Record<string, (TrackMentorAssignment | CurriculumTrackMentorAssignment)[]>>({})
  const [loadingTrackAssignments, setLoadingTrackAssignments] = useState(false)
  const [assigningTrack, setAssigningTrack] = useState(false)

  // Direct assignment state
  const [directMenteeId, setDirectMenteeId] = useState<string>('')
  const [directMentorId, setDirectMentorId] = useState<string>('')
  const [assigningDirect, setAssigningDirect] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')

  const selectedCohorts = useMemo(
    () => cohorts.filter((c) => selectedCohortIds.includes(String(c.id))),
    [cohorts, selectedCohortIds]
  )
  const firstTrack = useMemo(() => {
    const c = selectedCohorts[0]
    return c ? tracks.find((t) => String(t.id) === String(c.track)) : null
  }, [selectedCohorts, tracks])

  const filteredCohorts = useMemo(() => {
    const term = cohortSearch.trim().toLowerCase()
    if (!term) return cohorts
    return cohorts.filter((c) => {
      const name = c.name?.toLowerCase() || ''
      const trackName = (c.track_name || '').toLowerCase()
      const status = c.status?.toLowerCase() || ''
      return name.includes(term) || trackName.includes(term) || status.includes(term)
    })
  }, [cohorts, cohortSearch])

  const loadAssignmentsForCohorts = useCallback(async (cohortIds: string[]) => {
    if (cohortIds.length === 0) {
      setAssignmentsByCohort({})
      setMentorCohortNames({})
      return
    }
    setLoadingAssignments(true)
    const byCohort: Record<string, MentorAssignment[]> = {}
    const names: Record<string, string[]> = {}
    const cohortNameById: Record<string, string> = {}
    cohorts.forEach((c) => {
      cohortNameById[String(c.id)] = c.name
    })
    try {
      await Promise.all(
        cohortIds.map(async (cid) => {
          const raw = await programsClient.getCohortMentors(cid).catch(() => [])
          const list = Array.isArray(raw) ? raw : normalizeMentorList(raw)
          byCohort[cid] = list
          list.filter((a) => a.active).forEach((a) => {
            const mid = String(a.mentor ?? (a as any).mentor_id)
            if (!names[mid]) names[mid] = []
            const name = cohortNameById[cid] || cid
            if (!names[mid].includes(name)) names[mid].push(name)
          })
        })
      )
      setAssignmentsByCohort(byCohort)
      setMentorCohortNames(names)
    } finally {
      setLoadingAssignments(false)
    }
  }, [cohorts])

  useEffect(() => {
    loadAssignmentsForCohorts(selectedCohortIds)
  }, [selectedCohortIds, loadAssignmentsForCohorts])

  // Fetch curriculum tracks (same source as Director Tracks page) for "Assign to track"
  useEffect(() => {
    let cancelled = false
    setCurriculumTracksLoading(true)
    apiGateway
      .get('/curriculum/tracks/')
      .then((data: any) => {
        if (cancelled) return
        const list = data?.results ?? data?.data ?? (Array.isArray(data) ? data : [])
        setCurriculumTracks(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setCurriculumTracks([])
      })
      .finally(() => {
        if (!cancelled) setCurriculumTracksLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Show all curriculum tracks (same as Director Tracks). Only those with program_track_id can be assigned.
  const filteredTracks = useMemo(() => {
    const term = trackSearch.trim().toLowerCase()
    if (!term) return curriculumTracks
    return curriculumTracks.filter(
      (t) =>
        (t.name?.toLowerCase() || '').includes(term) ||
        (t.code?.toLowerCase() || '').includes(term) ||
        (t.slug?.toLowerCase() || '').includes(term) ||
        (t.title?.toLowerCase() || '').includes(term)
    )
  }, [curriculumTracks, trackSearch])

  const trackDisplayNameByTrackId = useMemo(() => {
    const map: Record<string, string> = {}
    curriculumTracks.forEach((t) => {
      const name = t.title || t.name || t.code || t.slug || ''
      if (t.program_track_id) map[String(t.program_track_id)] = name
      map[String(t.id)] = name
    })
    return map
  }, [curriculumTracks])

  const loadAssignmentsForTracks = useCallback(async (programTrackIds: string[], curriculumTrackIds: string[]) => {
    if (programTrackIds.length === 0 && curriculumTrackIds.length === 0) {
      setAssignmentsByTrack({})
      return
    }
    setLoadingTrackAssignments(true)
    const byTrack: Record<string, (TrackMentorAssignment | CurriculumTrackMentorAssignment)[]> = {}
    try {
      await Promise.all([
        ...programTrackIds.map(async (tid) => {
          const list = await programsClient.getTrackMentors(tid).catch(() => [])
          byTrack[tid] = Array.isArray(list) ? list : []
        }),
        ...curriculumTrackIds.map(async (cid) => {
          const list = await programsClient.getCurriculumTrackMentors(cid).catch(() => [])
          byTrack[cid] = Array.isArray(list) ? list : []
        }),
      ])
      setAssignmentsByTrack(byTrack)
    } finally {
      setLoadingTrackAssignments(false)
    }
  }, [])

  useEffect(() => {
    if (assignmentMode === 'track') loadAssignmentsForTracks(selectedProgramTrackIds, selectedCurriculumTrackIds)
  }, [assignmentMode, selectedProgramTrackIds, selectedCurriculumTrackIds, loadAssignmentsForTracks])

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase()
    if (!term) return students
    return students.filter((s) => {
      const name = [s.first_name, s.last_name].filter(Boolean).join(' ').toLowerCase()
      const email = (s.email || '').toLowerCase()
      return name.includes(term) || email.includes(term)
    })
  }, [students, studentSearch])

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 4000)
  }

  const handleAutoMatch = async () => {
    if (selectedCohortIds.length === 0) {
      showMessage('Select one or more cohorts first', true)
      return
    }
    setAutoMatching(true)
    setMessage(null)
    let totalAssigned = 0
    const errors: string[] = []
    try {
      for (const cid of selectedCohortIds) {
        try {
          const res = await programsClient.autoMatchMentors(
            cid,
            firstTrack ? String(firstTrack.id) : undefined,
            'support'
          )
          totalAssigned += res?.assignments?.length ?? 0
        } catch (e: any) {
          errors.push(`${cid}: ${e?.message || 'failed'}`)
        }
      }
      await loadAssignmentsForCohorts(selectedCohortIds)
      if (errors.length > 0) {
        showMessage(`Auto-match done for ${selectedCohortIds.length} cohort(s); ${totalAssigned} assigned. Some errors: ${errors.slice(0, 2).join('; ')}`, true)
      } else {
        showMessage(totalAssigned ? `Assigned ${totalAssigned} mentor(s) across selected cohorts.` : 'Auto-match completed for selected cohorts.')
      }
    } catch (e: any) {
      showMessage(e?.message || 'Auto-match failed.', true)
    } finally {
      setAutoMatching(false)
    }
  }

  const handleAssign = async () => {
    if (selectedCohortIds.length === 0 || !selectedMentorId) {
      showMessage('Select one or more cohorts and a mentor.', true)
      return
    }
    setAssigning(true)
    setMessage(null)
    const errors: string[] = []
    try {
      for (const cid of selectedCohortIds) {
        try {
          await programsClient.assignMentor(cid, {
            mentor: String(selectedMentorId),
            role: selectedRole,
          })
        } catch (e: any) {
          const msg = e?.message || 'Assign failed'
          if (msg.toLowerCase().includes('already')) {
            continue
          }
          errors.push(`${cid}: ${msg}`)
        }
      }
      await loadAssignmentsForCohorts(selectedCohortIds)
      setSelectedMentorId('')
      if (errors.length > 0) {
        showMessage(`Assigned where possible; some errors: ${errors.slice(0, 2).join('; ')}`, true)
      } else {
        showMessage('Mentor assigned to selected cohort(s).')
      }
    } catch (e: any) {
      showMessage(e?.message || 'Assign failed.', true)
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async (assignmentId: string, cohortId: string) => {
    if (!confirm('Remove this mentor from the cohort?')) return
    try {
      await programsClient.removeMentorAssignment(assignmentId)
      await loadAssignmentsForCohorts(selectedCohortIds)
      showMessage('Mentor removed.')
    } catch (e: any) {
      showMessage(e?.message || 'Remove failed.', true)
    }
  }

  const handleAssignToTrack = async () => {
    const totalSelected = selectedProgramTrackIds.length + selectedCurriculumTrackIds.length
    if (totalSelected === 0 || !selectedMentorId) {
      showMessage('Select one or more tracks and a mentor.', true)
      return
    }
    setAssigningTrack(true)
    setMessage(null)
    const errors: string[] = []
    try {
      for (const tid of selectedProgramTrackIds) {
        try {
          await programsClient.assignMentorToTrack(tid, { mentor: String(selectedMentorId), role: selectedRole })
        } catch (e: any) {
          const msg = e?.message || 'Assign failed'
          if (msg.toLowerCase().includes('already')) continue
          errors.push(`${tid}: ${msg}`)
        }
      }
      for (const cid of selectedCurriculumTrackIds) {
        try {
          await programsClient.assignMentorToCurriculumTrack(cid, { mentor: String(selectedMentorId), role: selectedRole })
        } catch (e: any) {
          const msg = e?.message || 'Assign failed'
          if (msg.toLowerCase().includes('already')) continue
          errors.push(`${cid}: ${msg}`)
        }
      }
      await loadAssignmentsForTracks(selectedProgramTrackIds, selectedCurriculumTrackIds)
      setSelectedMentorId('')
      if (errors.length > 0) {
        showMessage(`Assigned where possible; some errors: ${errors.slice(0, 2).join('; ')}`, true)
      } else {
        showMessage('Mentor assigned to selected track(s).')
      }
    } catch (e: any) {
      showMessage(e?.message || 'Assign failed.', true)
    } finally {
      setAssigningTrack(false)
    }
  }

  const handleRemoveTrack = async (assignmentId: string, trackId: string, isCurriculum: boolean) => {
    if (!confirm('Remove this mentor from the track?')) return
    try {
      if (isCurriculum) {
        await programsClient.removeCurriculumTrackMentorAssignment(assignmentId)
      } else {
        await programsClient.removeTrackMentorAssignment(assignmentId)
      }
      await loadAssignmentsForTracks(selectedProgramTrackIds, selectedCurriculumTrackIds)
      showMessage('Mentor removed from track.')
    } catch (e: any) {
      showMessage(e?.message || 'Remove failed.', true)
    }
  }

  const handleAssignDirect = async () => {
    if (!directMenteeId || !directMentorId) {
      showMessage('Select a student and a mentor.', true)
      return
    }
    setAssigningDirect(true)
    setMessage(null)
    try {
      await programsClient.assignMentorDirect(directMenteeId, directMentorId)
      showMessage('Mentor assigned directly to student.')
      setDirectMenteeId('')
      setDirectMentorId('')
    } catch (e: any) {
      showMessage(e?.message || 'Direct assign failed.', true)
    } finally {
      setAssigningDirect(false)
    }
  }

  const content = (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Mentor Assignment</h1>
            <p className="text-och-steel text-sm">Assign mentors to a cohort, a track, or directly to a student.</p>
          </div>

          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-och-midnight/60 border border-och-steel/20 w-fit">
            <button
              type="button"
              onClick={() => setAssignmentMode('cohort')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                assignmentMode === 'cohort' ? 'bg-och-mint text-och-midnight' : 'text-och-steel hover:text-white'
              }`}
            >
              Assign to Cohort
            </button>
            <button
              type="button"
              onClick={() => setAssignmentMode('track')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                assignmentMode === 'track' ? 'bg-och-mint text-och-midnight' : 'text-och-steel hover:text-white'
              }`}
            >
              Assign to Track
            </button>
            <button
              type="button"
              onClick={() => setAssignmentMode('direct')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                assignmentMode === 'direct' ? 'bg-och-mint text-och-midnight' : 'text-och-steel hover:text-white'
              }`}
            >
              Assign to Student (Direct)
            </button>
          </div>

          {message && (
            <p className={`text-sm mb-4 ${message.includes('failed') || message.includes('Select') || message.includes('errors') ? 'text-och-orange' : 'text-och-mint'}`}>
              {message}
            </p>
          )}

          {assignmentMode === 'cohort' && (
          <>
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Cohorts</h2>
                <p className="text-och-steel text-xs">
                  Select one or more cohorts to assign mentors.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCohortIds(filteredCohorts.map((c) => String(c.id)))}
                  disabled={filteredCohorts.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCohortIds([])}
                  disabled={selectedCohortIds.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={cohortSearch}
                  onChange={(e) => setCohortSearch(e.target.value)}
                  placeholder="Search by cohort name, track, or status…"
                  className="w-full px-3 py-2 rounded-lg bg-och-midnight/60 border border-och-steel/30 text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-mint"
                />
              </div>

              {cohortsLoading ? (
                <p className="text-och-steel text-sm">Loading cohorts…</p>
              ) : filteredCohorts.length === 0 ? (
                <p className="text-och-steel text-sm">No cohorts match your search.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {filteredCohorts.map((c) => {
                    const id = String(c.id)
                    const selected = selectedCohortIds.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedCohortIds((prev) =>
                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                          )
                        }}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          selected
                            ? 'border-och-mint bg-och-mint/10'
                            : 'border-och-steel/30 bg-och-midnight/60 hover:border-och-mint/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-white truncate">
                            {c.name}
                          </span>
                          <Badge
                            variant={
                              c.status === 'active' || c.status === 'running' ? 'mint' : 'steel'
                            }
                            className="text-[10px] uppercase"
                          >
                            {c.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-och-steel">
                          <span className="truncate">
                            {c.track_name ? `Track: ${c.track_name}` : 'No track assigned'}
                          </span>
                          <span>
                            {new Date(c.start_date).toLocaleDateString()} –{' '}
                            {new Date(c.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {selectedCohortIds.length > 0 ? (
            <Card className="p-6 mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedMentorId}
                    onChange={(e) => setSelectedMentorId(e.target.value)}
                    className="px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint min-w-[200px]"
                  >
                    <option value="">Select mentor</option>
                    {mentors.map((m) => {
                      const mid = String(m.id)
                      const label = (m as any).name || [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email
                      const alreadyIn = mentorCohortNames[mid]?.length ? ` (already in: ${mentorCohortNames[mid].join(', ')})` : ''
                      return (
                        <option key={m.id} value={mid}>
                          {label}{alreadyIn}
                        </option>
                      )
                    })}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'primary' | 'support' | 'guest')}
                    className="px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint"
                  >
                    <option value="primary">Primary</option>
                    <option value="support">Support</option>
                    <option value="guest">Guest</option>
                  </select>
                  <Button variant="mint" size="sm" onClick={handleAssign} disabled={assigning || !selectedMentorId}>
                    {assigning ? 'Assigning…' : 'Assign'}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-och-steel mb-2">Assigned mentors (by cohort)</p>
                {loadingAssignments ? (
                  <p className="text-och-steel text-sm">Loading…</p>
                ) : (
                  <ul className="space-y-3">
                    {selectedCohortIds.map((cid) => {
                      const cohortName = cohorts.find((c) => String(c.id) === cid)?.name ?? cid
                      const assignments = assignmentsByCohort[cid] ?? []
                      const active = assignments.filter((a) => a.active)
                      return (
                        <li key={cid} className="rounded-lg border border-och-steel/20 bg-och-midnight/30 p-3">
                          <p className="text-och-steel text-xs font-medium mb-2">{cohortName}</p>
                          {active.length === 0 ? (
                            <p className="text-och-steel text-sm">None yet. Use Auto-match or Assign above.</p>
                          ) : (
                            <ul className="space-y-2">
                              {active.map((a) => {
                                const mentorId = String(a.mentor ?? (a as any).mentor_id)
                                const mentor = mentors.find((m) => String(m.id) === mentorId)
                                const name = mentor
                                  ? (mentor as any).name || [mentor.first_name, mentor.last_name].filter(Boolean).join(' ') || mentor.email
                                  : mentorId
                                return (
                                  <li
                                    key={a.id ?? mentorId}
                                    className="flex items-center justify-between py-1.5 px-2 bg-och-midnight/50 rounded border border-och-steel/10"
                                  >
                                    <span className="text-white text-sm">{name}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="defender" className="text-xs">
                                        {(a.role || 'support')}
                                      </Badge>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-och-orange border-och-orange/50"
                                        onClick={() => handleRemove(a.id as string, cid)}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </Card>
          ) : null}
          </>
          )}

          {assignmentMode === 'track' && (
            <>
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">Curriculum Tracks</h2>
                <p className="text-och-steel text-xs mb-4">Same tracks as in Director Tracks. Select one or more; all students in those tracks will have the assigned mentor.</p>
                {curriculumTracksLoading ? (
                  <p className="text-och-steel text-sm py-4">Loading curriculum tracks…</p>
                ) : (
                  <>
                    <input
                      type="text"
                      value={trackSearch}
                      onChange={(e) => setTrackSearch(e.target.value)}
                      placeholder="Search by name, code, or slug…"
                      className="w-full px-3 py-2 rounded-lg bg-och-midnight/60 border border-och-steel/30 text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-mint mb-4"
                    />
                    <div className="flex gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedProgramTrackIds(filteredTracks.filter((t) => t.program_track_id).map((t) => String(t.program_track_id!)))
                        setSelectedCurriculumTrackIds(filteredTracks.filter((t) => !t.program_track_id).map((t) => String(t.id)))
                      }} disabled={filteredTracks.length === 0}>Select All</Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedProgramTrackIds([]); setSelectedCurriculumTrackIds([]) }} disabled={selectedProgramTrackIds.length === 0 && selectedCurriculumTrackIds.length === 0}>Clear</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {filteredTracks.map((t) => {
                        const programTrackId = t.program_track_id ? String(t.program_track_id) : ''
                        const curriculumTrackId = String(t.id)
                        const isProgram = !!programTrackId
                        const selected = isProgram ? selectedProgramTrackIds.includes(programTrackId) : selectedCurriculumTrackIds.includes(curriculumTrackId)
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              if (isProgram) {
                                setSelectedProgramTrackIds((prev) => (prev.includes(programTrackId) ? prev.filter((x) => x !== programTrackId) : [...prev, programTrackId]))
                              } else {
                                setSelectedCurriculumTrackIds((prev) => (prev.includes(curriculumTrackId) ? prev.filter((x) => x !== curriculumTrackId) : [...prev, curriculumTrackId]))
                              }
                            }}
                            className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${selected ? 'border-och-mint bg-och-mint/10' : 'border-och-steel/30 bg-och-midnight/60 hover:border-och-mint/40'}`}
                          >
                            <span className="text-sm font-semibold text-white">{t.title || t.name}</span>
                            <span className="text-[11px] text-och-steel block">{t.code} · {t.slug}</span>
                          </button>
                        )
                      })}
                    </div>
                    {filteredTracks.length === 0 && !curriculumTracksLoading && (
                      <p className="text-och-steel text-sm py-4">No curriculum tracks. Create tracks in Director Tracks first.</p>
                    )}
                  </>
                )}
              </Card>
              {(selectedProgramTrackIds.length > 0 || selectedCurriculumTrackIds.length > 0) && (
                <Card className="p-6 mb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <select
                      value={selectedMentorId}
                      onChange={(e) => setSelectedMentorId(e.target.value)}
                      className="px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint min-w-[200px]"
                    >
                      <option value="">Select mentor</option>
                      {mentors.map((m) => (
                        <option key={m.id} value={String(m.id)}>{(m as any).name || [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email}</option>
                      ))}
                    </select>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as 'primary' | 'support' | 'guest')} className="px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint">
                      <option value="primary">Primary</option>
                      <option value="support">Support</option>
                      <option value="guest">Guest</option>
                    </select>
                    <Button variant="mint" size="sm" onClick={handleAssignToTrack} disabled={assigningTrack || !selectedMentorId}>{assigningTrack ? 'Assigning…' : 'Assign to track(s)'}</Button>
                  </div>
                  <p className="text-sm font-medium text-och-steel mb-2">Assigned mentors by track</p>
                  {loadingTrackAssignments ? <p className="text-och-steel text-sm">Loading…</p> : (
                    <ul className="space-y-3">
                      {[...selectedProgramTrackIds.map((tid) => ({ id: tid, isCurriculum: false })), ...selectedCurriculumTrackIds.map((tid) => ({ id: tid, isCurriculum: true }))].map(({ id: tid, isCurriculum }) => {
                        const trackName = trackDisplayNameByTrackId[tid] ?? tid
                        const list = assignmentsByTrack[tid] ?? []
                        return (
                          <li key={`${isCurriculum}-${tid}`} className="rounded-lg border border-och-steel/20 bg-och-midnight/30 p-3">
                            <p className="text-och-steel text-xs font-medium mb-2">{trackName}</p>
                            {list.length === 0 ? <p className="text-och-steel text-sm">None yet.</p> : (
                              <ul className="space-y-2">
                                {list.map((a) => {
                                  const mentor = mentors.find((m) => String(m.id) === String(a.mentor))
                                  const name = mentor ? (mentor as any).name || [mentor.first_name, mentor.last_name].filter(Boolean).join(' ') || mentor.email : String(a.mentor)
                                  return (
                                    <li key={a.id} className="flex items-center justify-between py-1.5 px-2 bg-och-midnight/50 rounded border border-och-steel/10">
                                      <span className="text-white text-sm">{name}</span>
                                      <Button variant="outline" size="sm" className="text-och-orange border-och-orange/50" onClick={() => handleRemoveTrack(a.id, tid, isCurriculum)}>Remove</Button>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </Card>
              )}
            </>
          )}

          {assignmentMode === 'direct' && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">Direct assignment</h2>
              <p className="text-och-steel text-xs mb-4">Assign a mentor directly to a student (no cohort or track).</p>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name or email…"
                className="w-full px-3 py-2 rounded-lg bg-och-midnight/60 border border-och-steel/30 text-white text-sm placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-mint mb-4"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-och-steel text-xs font-medium mb-2 block">Student</label>
                  <select
                    value={directMenteeId}
                    onChange={(e) => setDirectMenteeId(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint"
                  >
                    <option value="">Select student</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={String(s.id)}>{[s.first_name, s.last_name].filter(Boolean).join(' ') || s.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-och-steel text-xs font-medium mb-2 block">Mentor</label>
                  <select
                    value={directMentorId}
                    onChange={(e) => setDirectMentorId(e.target.value)}
                    className="w-full px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint"
                  >
                    <option value="">Select mentor</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={String(m.id)}>{(m as any).name || [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button variant="mint" size="sm" className="mt-4" onClick={handleAssignDirect} disabled={assigningDirect || !directMenteeId || !directMentorId}>
                {assigningDirect ? 'Assigning…' : 'Assign mentor to student'}
              </Button>
            </Card>
          )}
        </div>
      </DirectorLayout>
    </RouteGuard>
  )

  return content
}
