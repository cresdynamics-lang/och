'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Link, Search, MoreHorizontal, Route } from 'lucide-react'
import { apiGateway } from '@/services/apiGateway'

interface CurriculumTrack {
  id: string
  slug: string
  name: string
  title?: string
  code: string
  description?: string
  level?: string
  tier?: number
  order_number?: number
}

interface DirectMentor {
  assignment_id: string
  mentor_id: string
  mentor_name: string
}

interface MentorEntry {
  type: 'cohort' | 'track' | 'direct'
  mentor_id: string
  mentor_name: string
  assignment_id?: string | null
}

interface Student {
  id: string
  uuid_id: string
  email: string
  first_name: string
  last_name: string
  sponsor_id?: string
  sponsor_name?: string
  track_key?: string | null
  track_display?: string | null
  direct_mentors?: DirectMentor[]
  all_mentors?: MentorEntry[]
  created_at: string
}

interface Sponsor {
  id: string
  uuid_id?: string
  email: string
  first_name: string
  last_name: string
  organization?: string
}

export function StudentsManagementClient() {
  const [students, setStudents] = useState<Student[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedSponsor, setSelectedSponsor] = useState('')
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [studentForMentor, setStudentForMentor] = useState<Student | null>(null)
  const [mentors, setMentors] = useState<{ id: number; uuid_id?: string; email: string; first_name?: string; last_name?: string }[]>([])
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [openActionRow, setOpenActionRow] = useState<string | null>(null)
  const [showChangeTrackModal, setShowChangeTrackModal] = useState(false)
  const [showChangeTrackConfirmModal, setShowChangeTrackConfirmModal] = useState(false)
  const [studentForTrackChange, setStudentForTrackChange] = useState<Student | null>(null)
  const [curriculumTracks, setCurriculumTracks] = useState<CurriculumTrack[]>([])
  const [selectedTrackSlug, setSelectedTrackSlug] = useState('')
  const [changeTrackLoading, setChangeTrackLoading] = useState(false)

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => {
    fetchStudents()
    fetchSponsors()
  }, [])

  const fetchStudents = async (cacheBust = false) => {
    try {
      const url = cacheBust ? `/director/students/?_=${Date.now()}` : '/director/students/'
      const response = await apiGateway.get<{ students?: Student[] }>(url)
      const list = response?.students ?? (response as any)?.data?.students ?? []
      setStudents(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSponsors = async () => {
    try {
      const data = await apiGateway.get<{ results: Sponsor[] }>('/users/', { params: { role: 'sponsor' } })
      setSponsors(data?.results ?? [])
    } catch (error) {
      console.error('Failed to fetch sponsors:', error)
    } finally {
      setLoading(false)
    }
  }

  const linkStudentsToSponsor = async () => {
    if (!selectedSponsor || selectedStudents.length === 0) return
    try {
      await apiGateway.post('/director/students/link-sponsor/', {
        student_ids: selectedStudents,
        sponsor_id: selectedSponsor,
      })
      await fetchStudents()
      setSelectedStudents([])
      setShowLinkModal(false)
      setSelectedSponsor('')
      showMsg('Students linked to sponsor.')
    } catch (e: any) {
      showMsg(e?.response?.data?.error || 'Failed to link students', 'error')
    }
  }

  const unlinkStudentFromSponsor = async (student: Student) => {
    if (!student.sponsor_id) return
    setActionLoading(`unlink-sponsor-${student.uuid_id}`)
    try {
      await apiGateway.post('/director/students/unlink-sponsor/', {
        student_ids: [student.uuid_id],
        sponsor_id: student.sponsor_id,
      })
      await fetchStudents()
      showMsg('Student unlinked from sponsor.')
    } catch (e: any) {
      showMsg(e?.response?.data?.error || 'Failed to unlink', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const removeDirectMentor = async (student: Student, assignmentId: string) => {
    setActionLoading(`remove-mentor-${assignmentId}`)
    try {
      await apiGateway.post('/director/students/remove-mentor/', { assignment_id: assignmentId })
      await fetchStudents()
      showMsg('Direct mentor removed.')
      setOpenActionRow(null)
    } catch (e: any) {
      showMsg(e?.response?.data?.error || 'Failed to remove mentor', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const openMentorModal = (student: Student) => {
    setStudentForMentor(student)
    setSelectedMentorId('')
    setShowMentorModal(true)
    setOpenActionRow(null)
    apiGateway.get<{ results?: any[] }>('/users/', { params: { role: 'mentor', page_size: 200 } })
      .then((data) => setMentors(data?.results ?? []))
      .catch(() => setMentors([]))
  }

  const linkStudentToMentor = async () => {
    if (!studentForMentor || !selectedMentorId) return
    setActionLoading('assign-mentor')
    try {
      await apiGateway.post('/director/mentors/assign-direct/', {
        mentee_id: String(studentForMentor.id),
        mentor_id: String(selectedMentorId),
      })
      setShowMentorModal(false)
      setStudentForMentor(null)
      setSelectedMentorId('')
      showMsg('Direct mentor assigned.')
      await fetchStudents(true)
    } catch (e: any) {
      const errMsg = e?.response?.data?.error || e?.message || 'Failed to assign mentor'
      showMsg(errMsg, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const openChangeTrackModal = (student: Student) => {
    setStudentForTrackChange(student)
    setSelectedTrackSlug('')
    setShowChangeTrackModal(true)
    setShowChangeTrackConfirmModal(false)
    setOpenActionRow(null)
    apiGateway
      .get('/curriculum/tracks/')
      .then((data: any) => {
        const list = data?.results ?? data?.data ?? data ?? []
        setCurriculumTracks(Array.isArray(list) ? list : [])
      })
      .catch(() => setCurriculumTracks([]))
  }

  const proceedToConfirmChangeTrack = () => {
    if (!selectedTrackSlug) return
    setShowChangeTrackModal(false)
    setShowChangeTrackConfirmModal(true)
  }

  const confirmChangeTrack = async () => {
    if (!studentForTrackChange || !selectedTrackSlug) return
    setChangeTrackLoading(true)
    try {
      await apiGateway.post('/director/students/change-track/', {
        student_id: studentForTrackChange.uuid_id,
        curriculum_track_slug: selectedTrackSlug,
      })
      setShowChangeTrackConfirmModal(false)
      setStudentForTrackChange(null)
      setSelectedTrackSlug('')
      showMsg("Student's track has been updated.")
      await fetchStudents(true)
    } catch (e: any) {
      const errMsg = e?.response?.data?.error || e?.message || 'Failed to change track'
      showMsg(errMsg, 'error')
    } finally {
      setChangeTrackLoading(false)
    }
  }

  const selectedTrack = curriculumTracks.find((t) => t.slug === selectedTrackSlug)
  const studentDisplayName =
    studentForTrackChange?.first_name && studentForTrackChange?.last_name
      ? `${studentForTrackChange.first_name} ${studentForTrackChange.last_name}`
      : studentForTrackChange?.email ?? ''

  const filteredStudents = students.filter(student =>
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-och-defender"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-och-defender" />
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Students Management</h1>
            <p className="text-och-steel">Manage students and link them to sponsors</p>
          </div>
        </div>
        
        {selectedStudents.length > 0 && (
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/90"
          >
            <Link className="w-4 h-4" />
            Link to Sponsor ({selectedStudents.length})
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-och-mint/20 text-och-mint' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-och-steel" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white placeholder-och-steel focus:outline-none focus:border-och-defender"
          />
        </div>
      </div>

      <div className="bg-och-midnight border border-och-steel/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-och-steel/10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents(filteredStudents.map(s => s.uuid_id))
                      } else {
                        setSelectedStudents([])
                      }
                    }}
                    className="rounded border-och-steel/20"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Tracks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Sponsor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Mentors</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-och-steel/20">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-och-steel/5">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.uuid_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.uuid_id])
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.uuid_id))
                        }
                      }}
                      className="rounded border-och-steel/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-och-defender flex items-center justify-center text-white text-sm font-medium">
                        {student.first_name?.[0] || student.email[0]}
                      </div>
                      <span className="text-white font-medium">
                        {student.first_name && student.last_name 
                          ? `${student.first_name} ${student.last_name}`
                          : student.email
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-och-steel">{student.email}</td>
                  <td className="px-4 py-3">
                    {student.track_display || student.track_key ? (
                      <span className="px-2 py-1 bg-och-midnight border border-och-steel/30 text-och-mint rounded text-sm">
                        {student.track_display || student.track_key}
                      </span>
                    ) : (
                      <span className="text-och-steel text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {student.sponsor_name ? (
                      <span className="px-2 py-1 bg-och-defender/20 text-och-mint rounded text-sm">
                        {student.sponsor_name}
                      </span>
                    ) : (
                      <span className="text-och-steel text-sm">Not linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(student.all_mentors && student.all_mentors.length > 0) ? (
                      <div className="flex flex-wrap gap-1">
                        {student.all_mentors.map((m, idx) => (
                          <span
                            key={`${m.mentor_id}-${m.type}-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-och-midnight border border-och-steel/30 rounded text-xs text-white"
                          >
                            {m.mentor_name}
                            <span className="text-och-steel text-[10px] uppercase">({m.type})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-och-steel text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-och-steel text-sm">
                    {new Date(student.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 relative">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setOpenActionRow(openActionRow === student.uuid_id ? null : student.uuid_id)}
                        className="p-1.5 rounded border border-och-steel/30 text-och-steel hover:bg-och-steel/10 hover:text-white transition-colors"
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openActionRow === student.uuid_id && (
                        <>
                          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpenActionRow(null)} />
                          <div className="absolute right-0 top-full mt-1 py-1 min-w-[200px] bg-och-midnight border border-och-steel/30 rounded-lg shadow-xl z-20">
                            <button
                              type="button"
                              onClick={() => openChangeTrackModal(student)}
                              className="w-full text-left px-3 py-2 text-sm text-och-mint hover:bg-och-mint/10 disabled:opacity-50"
                            >
                              Change track
                            </button>
                            <button
                              type="button"
                              onClick={() => openMentorModal(student)}
                              className="w-full text-left px-3 py-2 text-sm text-och-mint hover:bg-och-mint/10 disabled:opacity-50"
                            >
                              Assign direct mentor
                            </button>
                            {student.sponsor_id && (
                              <button
                                type="button"
                                onClick={() => { unlinkStudentFromSponsor(student); setOpenActionRow(null) }}
                                disabled={actionLoading === `unlink-sponsor-${student.uuid_id}`}
                                className="w-full text-left px-3 py-2 text-sm text-och-steel hover:bg-och-steel/10 hover:text-white disabled:opacity-50"
                              >
                                Remove from sponsor
                              </button>
                            )}
                            {student.direct_mentors?.map((dm) => (
                              <button
                                key={dm.assignment_id}
                                type="button"
                                onClick={() => removeDirectMentor(student, dm.assignment_id)}
                                disabled={actionLoading === `remove-mentor-${dm.assignment_id}`}
                                className="w-full text-left px-3 py-2 text-sm text-och-steel hover:bg-och-steel/10 hover:text-white disabled:opacity-50"
                              >
                                Remove mentor: {dm.mentor_name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link to Sponsor Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Link Students to Sponsor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  Select Sponsor
                </label>
                <select
                  value={selectedSponsor}
                  onChange={(e) => setSelectedSponsor(e.target.value)}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                >
                  <option value="">Choose a sponsor...</option>
                  {sponsors.map((sponsor) => (
                    <option key={(sponsor as any).uuid_id ?? sponsor.id} value={(sponsor as any).uuid_id ?? sponsor.id}>
                      {sponsor.first_name && sponsor.last_name 
                        ? `${sponsor.first_name} ${sponsor.last_name} (${sponsor.email})`
                        : sponsor.email
                      }
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-och-steel">
                Linking {selectedStudents.length} student(s) to sponsor
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-steel/10"
              >
                Cancel
              </button>
              <button
                onClick={linkStudentsToSponsor}
                disabled={!selectedSponsor}
                className="flex-1 px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Link Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change track: step 1 – select new track */}
      {showChangeTrackModal && studentForTrackChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="change-track-title">
          <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 id="change-track-title" className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Route className="w-5 h-5 text-och-mint" />
              Change student track
            </h3>
            <p className="text-sm text-och-steel mb-4">
              Select the new track for {studentDisplayName}. You will confirm in the next step.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-och-steel mb-2">Curriculum track</label>
              <select
                value={selectedTrackSlug}
                onChange={(e) => setSelectedTrackSlug(e.target.value)}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-mint"
              >
                <option value="">Choose a track...</option>
                {curriculumTracks.map((track) => (
                  <option key={track.id} value={track.slug}>
                    {track.title || track.name}
                    {track.code ? ` (${track.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowChangeTrackModal(false); setStudentForTrackChange(null); setSelectedTrackSlug('') }}
                className="flex-1 px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-steel/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={proceedToConfirmChangeTrack}
                disabled={!selectedTrackSlug}
                className="flex-1 px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change track: step 2 – confirm with explanation */}
      {showChangeTrackConfirmModal && studentForTrackChange && selectedTrack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="change-track-confirm-title">
          <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h3 id="change-track-confirm-title" className="text-lg font-semibold text-white mb-3">Confirm track change</h3>
            <p className="text-sm text-och-steel mb-2">
              You are about to change <span className="text-white font-medium">{studentDisplayName}</span> from their current track to <span className="text-och-mint font-medium">{selectedTrack.title || selectedTrack.name}</span>.
            </p>
            <div className="p-4 rounded-lg bg-och-midnight/80 border border-och-steel/20 text-sm text-och-steel mb-6">
              <p className="font-medium text-white mb-2">When you confirm:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The student&apos;s track will be updated and they will see content and curriculum for the new track.</li>
                <li>Track-based mentor assignments may change according to the new track.</li>
                <li>Their cohort enrollment (if any) is unchanged; only their track assignment is updated.</li>
                <li>Progress tied to the previous track may no longer apply to the new track.</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowChangeTrackConfirmModal(false); setShowChangeTrackModal(true); setSelectedTrackSlug(selectedTrack.slug) }}
                disabled={changeTrackLoading}
                className="flex-1 px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-steel/10 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={confirmChangeTrack}
                disabled={changeTrackLoading}
                className="flex-1 px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changeTrackLoading ? 'Updating…' : 'Confirm change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link to Mentor (direct assignment) Modal */}
      {showMentorModal && studentForMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-och-midnight border border-och-steel/20 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Assign direct mentor</h3>
            <p className="text-sm text-och-steel mb-4">
              Assign a mentor directly to {studentForMentor.first_name || studentForMentor.last_name ? `${studentForMentor.first_name} ${studentForMentor.last_name}` : studentForMentor.email}. This is independent of cohort or track.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">Select mentor</label>
                <select
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  className="w-full px-3 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                >
                  <option value="">Choose a mentor...</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={String(mentor.id)}>
                      {mentor.first_name && mentor.last_name
                        ? `${mentor.first_name} ${mentor.last_name} (${mentor.email})`
                        : mentor.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowMentorModal(false); setStudentForMentor(null); setSelectedMentorId('') }}
                className="flex-1 px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-steel/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={linkStudentToMentor}
                disabled={!selectedMentorId || actionLoading === 'assign-mentor'}
                className="flex-1 px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'assign-mentor' ? 'Assigning…' : 'Assign mentor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}