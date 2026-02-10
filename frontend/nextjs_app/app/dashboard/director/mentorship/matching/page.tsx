'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohorts, useTracks } from '@/hooks/usePrograms'
import { programsClient, type MentorAssignment } from '@/services/programsClient'
import { useUsers } from '@/hooks/useUsers'

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
  const mentors = useMemo(() => mentorsFromApi || [], [mentorsFromApi])

  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>([])
  const [assignmentsByCohort, setAssignmentsByCohort] = useState<Record<string, MentorAssignment[]>>({})
  const [mentorCohortNames, setMentorCohortNames] = useState<Record<string, string[]>>({})
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [autoMatching, setAutoMatching] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'primary' | 'support' | 'guest'>('support')
  const [message, setMessage] = useState<string | null>(null)

  const selectedCohorts = useMemo(
    () => cohorts.filter((c) => selectedCohortIds.includes(String(c.id))),
    [cohorts, selectedCohortIds]
  )
  const firstTrack = useMemo(() => {
    const c = selectedCohorts[0]
    return c ? tracks.find((t) => String(t.id) === String(c.track)) : null
  }, [selectedCohorts, tracks])

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

  const content = (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Auto-Matching (Mentor Assignment)</h1>
            <p className="text-och-steel text-sm">Assign mentors to a cohort or use auto-match.</p>
          </div>

          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-och-steel">Cohorts (select one or more)</label>
              <select
                multiple
                value={selectedCohortIds}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions, (o) => o.value)
                  setSelectedCohortIds(opts)
                }}
                className="w-full max-w-md min-h-[120px] px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-och-steel text-xs">Hold Ctrl/Cmd to select multiple.</p>
              {cohortsLoading && <p className="text-och-steel text-sm">Loading cohorts…</p>}
            </div>
          </Card>

          {selectedCohortIds.length > 0 ? (
            <Card className="p-6 mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Button
                  variant="defender"
                  size="sm"
                  onClick={handleAutoMatch}
                  disabled={autoMatching}
                >
                  {autoMatching ? 'Matching…' : 'Auto-match'}
                </Button>
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
              {message && (
                <p className={`text-sm mb-4 ${message.includes('failed') || message.includes('Select') || message.includes('errors') ? 'text-och-orange' : 'text-och-mint'}`}>
                  {message}
                </p>
              )}
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
        </div>
      </DirectorLayout>
    </RouteGuard>
  )

  return content
}
