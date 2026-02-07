'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCohorts, useTracks } from '@/hooks/usePrograms'
import { programsClient, type MentorAssignment } from '@/services/programsClient'
import { useUsers } from '@/hooks/useUsers'

export default function MentorshipMatchingPage() {
  const { cohorts, isLoading: cohortsLoading } = useCohorts({ page: 1, pageSize: 500 })
  const { tracks } = useTracks()
  const { users: mentorsFromApi } = useUsers({ page: 1, page_size: 200, role: 'mentor' })
  const mentors = useMemo(() => mentorsFromApi || [], [mentorsFromApi])

  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [assignments, setAssignments] = useState<MentorAssignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [autoMatching, setAutoMatching] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'primary' | 'support' | 'guest'>('support')
  const [message, setMessage] = useState<string | null>(null)

  const selectedCohort = useMemo(
    () => cohorts.find((c) => String(c.id) === selectedCohortId),
    [cohorts, selectedCohortId]
  )
  const track = useMemo(
    () => (selectedCohort ? tracks.find((t) => String(t.id) === String(selectedCohort.track)) : null),
    [selectedCohort, tracks]
  )
  const assignedMentorIds = useMemo(
    () => assignments.filter((a) => a.active).map((a) => String(a.mentor ?? (a as any).mentor_id)),
    [assignments]
  )
  const availableMentors = useMemo(
    () => mentors.filter((m) => !assignedMentorIds.includes(String(m.id))),
    [mentors, assignedMentorIds]
  )

  useEffect(() => {
    if (!selectedCohortId) {
      setAssignments([])
      return
    }
    let cancelled = false
    setLoadingAssignments(true)
    programsClient
      .getCohortMentors(selectedCohortId)
      .then((list) => {
        if (!cancelled) setAssignments(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setAssignments([])
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignments(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedCohortId])

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 4000)
  }

  const handleAutoMatch = async () => {
    if (!selectedCohortId) {
      showMessage('Select a cohort first', true)
      return
    }
    setAutoMatching(true)
    setMessage(null)
    try {
      const res = await programsClient.autoMatchMentors(
        selectedCohortId,
        track ? String(track.id) : undefined,
        'support'
      )
      const list = await programsClient.getCohortMentors(selectedCohortId)
      setAssignments(Array.isArray(list) ? list : [])
      showMessage((res?.assignments?.length ? `Assigned ${res.assignments.length} mentor(s).` : 'Auto-match completed.') || 'Done.')
    } catch (e: any) {
      showMessage(e?.message || 'Auto-match failed.', true)
    } finally {
      setAutoMatching(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedCohortId || !selectedMentorId) {
      showMessage('Select a cohort and a mentor.', true)
      return
    }
    setAssigning(true)
    setMessage(null)
    try {
      await programsClient.assignMentor(selectedCohortId, {
        mentor: String(selectedMentorId),
        role: selectedRole,
      })
      const list = await programsClient.getCohortMentors(selectedCohortId)
      setAssignments(Array.isArray(list) ? list : [])
      setSelectedMentorId('')
      showMessage('Mentor assigned.')
    } catch (e: any) {
      showMessage(e?.message || 'Assign failed.', true)
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async (assignmentId: string) => {
    if (!selectedCohortId || !confirm('Remove this mentor from the cohort?')) return
    try {
      await programsClient.removeMentorAssignment(assignmentId)
      const list = await programsClient.getCohortMentors(selectedCohortId)
      setAssignments(Array.isArray(list) ? list : [])
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
              <label className="block text-sm font-medium text-och-steel">Cohort</label>
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="">Select a cohort</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {cohortsLoading && <p className="text-och-steel text-sm">Loading cohorts…</p>}
            </div>
          </Card>

          {selectedCohortId ? (
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
                    className="px-3 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white text-sm focus:outline-none focus:border-och-mint"
                  >
                    <option value="">Select mentor</option>
                    {availableMentors.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {(m as any).name || [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email}
                      </option>
                    ))}
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
                <p className={`text-sm mb-4 ${message.includes('failed') || message.includes('Select') ? 'text-och-orange' : 'text-och-mint'}`}>
                  {message}
                </p>
              )}
              <div>
                <p className="text-sm font-medium text-och-steel mb-2">Assigned mentors</p>
                {loadingAssignments ? (
                  <p className="text-och-steel text-sm">Loading…</p>
                ) : assignments.filter((a) => a.active).length === 0 ? (
                  <p className="text-och-steel text-sm">None yet. Use Auto-match or Assign above.</p>
                ) : (
                  <ul className="space-y-2">
                    {assignments
                      .filter((a) => a.active)
                      .map((a) => {
                        const mentorId = String(a.mentor ?? (a as any).mentor_id)
                        const mentor = mentors.find((m) => String(m.id) === mentorId)
                        const name = mentor
                          ? (mentor as any).name || [mentor.first_name, mentor.last_name].filter(Boolean).join(' ') || mentor.email
                          : mentorId
                        return (
                          <li
                            key={a.id ?? mentorId}
                            className="flex items-center justify-between py-2 px-3 bg-och-midnight/50 rounded-lg border border-och-steel/20"
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
                                onClick={() => handleRemove(a.id as string)}
                              >
                                Remove
                              </Button>
                            </div>
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
