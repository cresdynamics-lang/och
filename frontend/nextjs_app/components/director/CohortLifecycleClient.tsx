'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

interface Cohort {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string
  seat_cap: number
  mode: string
  track: {
    name: string
    program: {
      name: string
    }
  }
}

interface LifecycleInfo {
  current_status: string
  available_transitions: string[]
  readiness_checks: any
  metrics: {
    total_enrollments: number
    active_enrollments: number
    completed_enrollments: number
    seat_utilization: number
    days_until_start: number | null
    days_until_end: number | null
  }
}

const STATUS_COLORS = {
  draft: 'steel',
  active: 'defender',
  running: 'mint',
  closing: 'orange',
  closed: 'red'
}

const STATUS_DESCRIPTIONS = {
  draft: 'Planning phase - cohort is being set up',
  active: 'Ready to start - enrollments open',
  running: 'In progress - sessions ongoing',
  closing: 'Wrapping up - final submissions',
  closed: 'Completed - certificates issued'
}

export default function CohortLifecycleClient() {
  const { user } = useAuth()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string>('')
  const [lifecycleInfo, setLifecycleInfo] = useState<LifecycleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<Cohort>>({})

  useEffect(() => {
    loadCohorts()
  }, [])

  useEffect(() => {
    if (selectedCohort) {
      loadLifecycleInfo(selectedCohort)
    }
  }, [selectedCohort])

  const loadCohorts = async () => {
    try {
      const response = await fetch('/api/v1/director/cohorts-management/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCohorts(data.results || data)
      }
    } catch (error) {
      console.error('Error loading cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLifecycleInfo = async (cohortId: string) => {
    try {
      const response = await fetch(`/api/v1/director/cohorts-lifecycle/${cohortId}/lifecycle_info/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLifecycleInfo(data)
      }
    } catch (error) {
      console.error('Error loading lifecycle info:', error)
    }
  }

  const transitionStatus = async (newStatus: string) => {
    if (!selectedCohort) return

    setTransitioning(true)
    try {
      const response = await fetch(`/api/v1/director/cohorts-lifecycle/${selectedCohort}/transition_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadCohorts()
        await loadLifecycleInfo(selectedCohort)
      } else {
        const error = await response.json()
        console.error('Failed to transition status:', error)
      }
    } catch (error) {
      console.error('Error transitioning status:', error)
    } finally {
      setTransitioning(false)
    }
  }

  const saveAdvancedEdit = async () => {
    if (!selectedCohort) return

    try {
      const response = await fetch(`/api/v1/director/cohorts-lifecycle/${selectedCohort}/advanced_edit/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        await loadCohorts()
        await loadLifecycleInfo(selectedCohort)
        setEditMode(false)
        setEditData({})
      } else {
        const error = await response.json()
        console.error('Failed to save changes:', error)
      }
    } catch (error) {
      console.error('Error saving changes:', error)
    }
  }

  const selectedCohortData = cohorts.find(c => c.id === selectedCohort)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-defender mx-auto mb-4"></div>
          <p className="text-och-steel">Loading cohort data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Cohort Lifecycle Management</h1>
        <p className="text-och-steel">Manage cohort status transitions and advanced settings</p>
      </div>

      {/* Cohort Selection */}
      <Card className="mb-6">
        <div className="p-6">
          <label className="block text-sm font-medium text-och-steel mb-2">
            Select Cohort
          </label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
          >
            <option value="">Choose a cohort...</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} - {cohort.track.program.name} ({cohort.status})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {selectedCohort && selectedCohortData && lifecycleInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Status & Transitions */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Status Management</h2>
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={STATUS_COLORS[lifecycleInfo.current_status as keyof typeof STATUS_COLORS] as any}>
                    {lifecycleInfo.current_status}
                  </Badge>
                  <span className="text-white font-semibold">{selectedCohortData.name}</span>
                </div>
                <p className="text-sm text-och-steel">
                  {STATUS_DESCRIPTIONS[lifecycleInfo.current_status as keyof typeof STATUS_DESCRIPTIONS]}
                </p>
              </div>

              {/* Available Transitions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Available Transitions</h3>
                {lifecycleInfo.available_transitions.length > 0 ? (
                  <div className="space-y-2">
                    {lifecycleInfo.available_transitions.map((status) => (
                      <Button
                        key={status}
                        variant="defender"
                        size="sm"
                        onClick={() => transitionStatus(status)}
                        disabled={transitioning}
                        className="mr-2"
                      >
                        {transitioning ? 'Transitioning...' : `Move to ${status}`}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-och-steel">No transitions available from current status</p>
                )}
              </div>

              {/* Readiness Checks */}
              {lifecycleInfo.readiness_checks.active && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Readiness Checks</h3>
                  <div className="space-y-2">
                    {lifecycleInfo.readiness_checks.active.requirements.map((req: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${req.status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={`text-sm ${req.status ? 'text-och-steel' : 'text-red-400'}`}>
                          {req.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Metrics & Advanced Editing */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Cohort Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editMode) {
                      setEditMode(false)
                      setEditData({})
                    } else {
                      setEditMode(true)
                      setEditData({
                        name: selectedCohortData.name,
                        seat_cap: selectedCohortData.seat_cap,
                        start_date: selectedCohortData.start_date,
                        end_date: selectedCohortData.end_date,
                        mode: selectedCohortData.mode
                      })
                    }
                  }}
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">Name</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">Seat Capacity</label>
                    <input
                      type="number"
                      value={editData.seat_cap || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, seat_cap: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">Start Date</label>
                      <input
                        type="date"
                        value={editData.start_date || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-och-steel mb-2">End Date</label>
                      <input
                        type="date"
                        value={editData.end_date || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-och-steel mb-2">Mode</label>
                    <select
                      value={editData.mode || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, mode: e.target.value }))}
                      className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:border-och-defender focus:outline-none"
                    >
                      <option value="virtual">Virtual</option>
                      <option value="onsite">Onsite</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="defender"
                    onClick={saveAdvancedEdit}
                    className="w-full"
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-och-midnight/50 rounded-lg">
                      <p className="text-xs text-och-steel">Total Enrollments</p>
                      <p className="text-xl font-bold text-white">{lifecycleInfo.metrics.total_enrollments}</p>
                    </div>
                    <div className="p-3 bg-och-midnight/50 rounded-lg">
                      <p className="text-xs text-och-steel">Active Enrollments</p>
                      <p className="text-xl font-bold text-white">{lifecycleInfo.metrics.active_enrollments}</p>
                    </div>
                    <div className="p-3 bg-och-midnight/50 rounded-lg">
                      <p className="text-xs text-och-steel">Seat Utilization</p>
                      <p className="text-xl font-bold text-white">{lifecycleInfo.metrics.seat_utilization.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-och-midnight/50 rounded-lg">
                      <p className="text-xs text-och-steel">Completed</p>
                      <p className="text-xl font-bold text-white">{lifecycleInfo.metrics.completed_enrollments}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-och-steel">Start Date:</span>
                      <span className="text-white">{selectedCohortData.start_date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-och-steel">End Date:</span>
                      <span className="text-white">{selectedCohortData.end_date}</span>
                    </div>
                    {lifecycleInfo.metrics.days_until_start !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Days Until Start:</span>
                        <span className="text-white">{lifecycleInfo.metrics.days_until_start}</span>
                      </div>
                    )}
                    {lifecycleInfo.metrics.days_until_end !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-och-steel">Days Until End:</span>
                        <span className="text-white">{lifecycleInfo.metrics.days_until_end}</span>
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2 pt-4 border-t border-och-steel/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-och-steel">Mode:</span>
                      <Badge variant="outline">{selectedCohortData.mode}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-och-steel">Seat Capacity:</span>
                      <span className="text-white">{selectedCohortData.seat_cap}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-och-steel">Track:</span>
                      <span className="text-white">{selectedCohortData.track.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}