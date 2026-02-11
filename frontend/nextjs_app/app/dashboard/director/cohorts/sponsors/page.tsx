'use client'

import { useState, useEffect } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DirectorLayout } from '@/components/director/DirectorLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiGateway } from '@/services/apiGateway'

interface SponsorAssignment {
  id: string
  sponsor: {
    id: string
    name: string
    email: string
    organization?: {
      name: string
    }
  }
  cohort: {
    id: string
    name: string
    track: {
      name: string
    }
  }
  role: string
  seat_allocation: number
  start_date?: string
  end_date?: string
  funding_agreement_id?: string
  created_at: string
}

interface Sponsor {
  id: string
  name: string
  email: string
  organization?: {
    id: string
    name: string
    org_type: string
  }
  status: string
  created_at: string
}

interface Cohort {
  id: string
  name: string
  track: {
    name: string
    program: {
      name: string
    }
  }
  status: string
  start_date: string
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [assignments, setAssignments] = useState<SponsorAssignment[]>([])
  const [selectedSponsors, setSelectedSponsors] = useState<Set<string>>(new Set())
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'sponsors' | 'assignments'>('sponsors')
  const [assignmentData, setAssignmentData] = useState({
    role: 'funding',
    seatAllocation: 0,
    startDate: '',
    endDate: '',
    fundingAgreementId: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Load sponsors (users with sponsor role or from sponsor organizations)
      const sponsorsData = await apiGateway.get('/users?role=sponsor') as any
      const sponsorsList = sponsorsData?.results || sponsorsData?.data || sponsorsData || []
      setSponsors(sponsorsList)

      // Load cohorts
      const cohortsData = await apiGateway.get('/cohorts/') as any
      const cohortsList = cohortsData?.results || cohortsData?.data || cohortsData || []
      setCohorts(cohortsList)

      // Load sponsor assignments
      const assignmentsData = await apiGateway.get('/sponsor-assignments/') as any
      const assignmentsList = assignmentsData?.data || assignmentsData?.results || assignmentsData || []
      setAssignments(assignmentsList)
    } catch (err: any) {
      console.error('Failed to load data:', err)
      setError(err?.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSponsorSelection = (sponsorId: string) => {
    const newSelection = new Set(selectedSponsors)
    if (newSelection.has(sponsorId)) {
      newSelection.delete(sponsorId)
    } else {
      newSelection.add(sponsorId)
    }
    setSelectedSponsors(newSelection)
  }

  const handleAssignSponsors = async () => {
    if (!selectedCohort || selectedSponsors.size === 0 || !assignmentData.seatAllocation) {
      setError('Please select a cohort, at least one sponsor, and specify seat allocation')
      return
    }

    setIsAssigning(true)
    setError(null)
    setSuccess(null)

    try {
      // Assign each selected sponsor to the cohort
      const assignments = []
      for (const sponsorId of Array.from(selectedSponsors)) {
        try {
          const payload = {
            sponsor_id: sponsorId,
            seat_allocation: assignmentData.seatAllocation,
            role: assignmentData.role,
            ...(assignmentData.startDate && { start_date: assignmentData.startDate }),
            ...(assignmentData.endDate && { end_date: assignmentData.endDate }),
            ...(assignmentData.fundingAgreementId && { funding_agreement_id: assignmentData.fundingAgreementId })
          }
          
          const result = await apiGateway.post(`/cohorts/${selectedCohort}/sponsors/`, payload)
          assignments.push(result)
        } catch (err: any) {
          console.error(`Failed to assign sponsor ${sponsorId}:`, err)
        }
      }

      if (assignments.length > 0) {
        setSuccess(`Successfully assigned ${assignments.length} sponsor(s) to cohort`)
        setSelectedSponsors(new Set())
        setSelectedCohort('')
        setAssignmentData({
          role: 'funding',
          seatAllocation: 0,
          startDate: '',
          endDate: '',
          fundingAgreementId: ''
        })
        setShowAssignModal(false)
      } else {
        setError('Failed to assign sponsors. Please try again.')
      }
    } catch (err: any) {
      console.error('Failed to assign sponsors:', err)
      setError(err?.message || 'Failed to assign sponsors')
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoading) {
    return (
      <RouteGuard>
        <DirectorLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
              <p className="text-och-steel">Loading sponsors...</p>
            </div>
          </div>
        </DirectorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <DirectorLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-och-defender">Sponsor Management</h1>
                <p className="text-och-steel">View and assign sponsors to cohorts</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
                {selectedSponsors.size > 0 && (
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={() => setShowAssignModal(true)}
                  >
                    Assign to Cohort ({selectedSponsors.size})
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <Card className="mb-6 border-och-orange/50">
                <div className="p-4 text-och-orange">{error}</div>
              </Card>
            )}

            {success && (
              <Card className="mb-6 border-och-mint/50">
                <div className="p-4 text-och-mint">{success}</div>
              </Card>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-och-steel/20">
            <button
              onClick={() => setActiveTab('sponsors')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'sponsors'
                  ? 'text-och-defender border-b-2 border-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Sponsors ({sponsors.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'assignments'
                  ? 'text-och-defender border-b-2 border-och-defender'
                  : 'text-och-steel hover:text-white'
              }`}
            >
              Assignments ({assignments.length})
            </button>
          </div>

          {/* Sponsors Table */}
          {activeTab === 'sponsors' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Sponsors ({sponsors.length})
                  </h2>
                </div>

                {sponsors.length === 0 ? (
                  <div className="text-center py-12 text-och-steel">
                    <p>No sponsors found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left py-3 px-4 text-sm text-och-steel">
                            <input
                              type="checkbox"
                              checked={selectedSponsors.size === sponsors.length && sponsors.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSponsors(new Set(sponsors.map(s => s.id)))
                                } else {
                                  setSelectedSponsors(new Set())
                                }
                              }}
                              className="w-4 h-4 rounded border-och-steel/20 bg-och-midnight text-och-defender focus:ring-och-defender"
                            />
                          </th>
                          <th className="text-left py-3 px-4 text-sm text-och-steel">Sponsor</th>
                          <th className="text-left py-3 px-4 text-sm text-och-steel">Organization</th>
                          <th className="text-center py-3 px-4 text-sm text-och-steel">Status</th>
                          <th className="text-center py-3 px-4 text-sm text-och-steel">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sponsors.map((sponsor) => (
                          <tr
                            key={sponsor.id}
                            className="border-b border-och-steel/10 hover:bg-och-midnight/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedSponsors.has(sponsor.id)}
                                onChange={() => handleSponsorSelection(sponsor.id)}
                                className="w-4 h-4 rounded border-och-steel/20 bg-och-midnight text-och-defender focus:ring-och-defender"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white font-medium">{sponsor.name}</p>
                                <p className="text-xs text-och-steel">{sponsor.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-och-steel">
                              {sponsor.organization?.name || 'No Organization'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={sponsor.status === 'active' ? 'mint' : 'orange'}
                              >
                                {sponsor.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-och-steel">
                              {new Date(sponsor.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Assignments Table */}
          {activeTab === 'assignments' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Sponsor Assignments ({assignments.length})
                  </h2>
                </div>

                {assignments.length === 0 ? (
                  <div className="text-center py-12 text-och-steel">
                    <p>No sponsor assignments found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-och-steel/20">
                          <th className="text-left py-3 px-4 text-sm text-och-steel">Sponsor</th>
                          <th className="text-left py-3 px-4 text-sm text-och-steel">Cohort</th>
                          <th className="text-center py-3 px-4 text-sm text-och-steel">Role</th>
                          <th className="text-center py-3 px-4 text-sm text-och-steel">Seats</th>
                          <th className="text-center py-3 px-4 text-sm text-och-steel">Duration</th>
                          <th className="text-center py-3 px-4 text-sm text-och-steel">Agreement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assignment) => (
                          <tr
                            key={assignment.id}
                            className="border-b border-och-steel/10 hover:bg-och-midnight/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white font-medium">{assignment.sponsor.name}</p>
                                <p className="text-xs text-och-steel">{assignment.sponsor.email}</p>
                                {assignment.sponsor.organization && (
                                  <p className="text-xs text-och-steel">{assignment.sponsor.organization.name}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white font-medium">{assignment.cohort.name}</p>
                                <p className="text-xs text-och-steel">{assignment.cohort.track?.name || 'Unknown Track'}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={
                                  assignment.role === 'funding' ? 'mint' :
                                  assignment.role === 'mentoring' ? 'defender' : 'orange'
                                }
                              >
                                {assignment.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center text-white font-medium">
                              {assignment.seat_allocation}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-och-steel">
                              {assignment.start_date && assignment.end_date ? (
                                <div>
                                  <div>{new Date(assignment.start_date).toLocaleDateString()}</div>
                                  <div>to {new Date(assignment.end_date).toLocaleDateString()}</div>
                                </div>
                              ) : (
                                'Ongoing'
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-och-steel">
                              {assignment.funding_agreement_id || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Assign to Cohort Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-och-midnight border border-och-steel/20 rounded-xl shadow-xl">
              <div className="p-6 border-b border-och-steel/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Assign Sponsors to Cohort</h3>
                  <p className="text-sm text-och-steel mt-1">
                    {selectedSponsors.size} sponsor(s) selected
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignModal(false)}
                  disabled={isAssigning}
                >
                  Close
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Cohort</label>
                  <select
                    value={selectedCohort}
                    onChange={(e) => setSelectedCohort(e.target.value)}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="">Choose a cohort...</option>
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name} ({cohort.track.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Role</label>
                  <select
                    value={assignmentData.role}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                  >
                    <option value="funding">Funding</option>
                    <option value="compliance">Compliance</option>
                    <option value="mentoring">Mentoring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Seat Allocation</label>
                  <input
                    type="number"
                    min="1"
                    value={assignmentData.seatAllocation}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, seatAllocation: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="Number of seats"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Start Date</label>
                    <input
                      type="date"
                      value={assignmentData.startDate}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">End Date</label>
                    <input
                      type="date"
                      value={assignmentData.endDate}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Funding Agreement ID (Optional)</label>
                  <input
                    type="text"
                    value={assignmentData.fundingAgreementId}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, fundingAgreementId: e.target.value }))}
                    className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-white focus:outline-none focus:border-och-defender"
                    placeholder="Agreement reference"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignModal(false)}
                    disabled={isAssigning}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="defender"
                    size="sm"
                    onClick={handleAssignSponsors}
                    disabled={isAssigning || !selectedCohort || !assignmentData.seatAllocation}
                    className="flex-1"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Sponsors'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DirectorLayout>
    </RouteGuard>
  )
}