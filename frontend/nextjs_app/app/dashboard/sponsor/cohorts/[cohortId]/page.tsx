'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { sponsorClient } from '@/services/sponsorClient'
import Link from 'next/link'
import { ArrowLeft, Users, BookOpen, TrendingUp, FileText, Download, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnrollStudentsModal } from '@/components/sponsor/EnrollStudentsModal'

const TAB_IDS = ['overview', 'students', 'progress', 'reports'] as const
type TabId = (typeof TAB_IDS)[number]

function isValidTab(t: string | null): t is TabId {
  return t !== null && TAB_IDS.includes(t as TabId)
}

export default function SponsorCohortDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const cohortId = params.cohortId as string
  const tabFromUrl = searchParams.get('tab')
  const activeTab: TabId = isValidTab(tabFromUrl) ? tabFromUrl : 'overview'

  const [cohort, setCohort] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  const setTab = (tab: TabId) => {
    router.replace(`/dashboard/sponsor/cohorts/${cohortId}?tab=${tab}`, { scroll: false })
  }

  useEffect(() => {
    if (cohortId) {
      loadCohortData()
    }
  }, [cohortId])

  const loadCohortData = useCallback(async () => {
    try {
      setLoading(true)
      const [cohortData, studentsData] = await Promise.all([
        sponsorClient.getCohortReports(cohortId),
        sponsorClient.getSponsoredStudents(cohortId)
      ])
      setCohort(cohortData)
      setStudents(studentsData.students || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load cohort details')
    } finally {
      setLoading(false)
    }
  }, [cohortId])

  const handleExportReport = async (format: 'json' | 'csv') => {
    setExporting(true)
    try {
      const base = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      const url = `${base}/api/v1/sponsor/reports/export?format=${format}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cohort_id: cohortId, format }),
      })
      if (!res.ok) throw new Error('Export failed')
      if (format === 'csv') {
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `cohort-${cohort?.cohort_name || cohortId}-report.csv`
        a.click()
        URL.revokeObjectURL(a.href)
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `cohort-${cohort?.cohort_name || cohortId}-report.json`
        a.click()
        URL.revokeObjectURL(a.href)
      }
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
        <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
          <div className="text-och-steel">Loading cohort details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
        <div className="mb-6">
          <Link 
            href="/dashboard/sponsor/cohorts"
            className="inline-flex items-center text-och-mint hover:text-och-mint/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cohorts
          </Link>
        </div>
        <div className="bg-och-slate-800 rounded-lg p-6 border border-och-slate-700">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-6">
        <Link 
          href="/dashboard/sponsor/cohorts"
          className="inline-flex items-center text-och-mint hover:text-och-mint/80 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cohorts
        </Link>
        <h1 className="text-4xl font-bold mb-2 text-och-mint">{cohort?.cohort_name || 'Cohort Details'}</h1>
        <p className="text-och-steel">Manage your sponsored cohort and track student progress</p>
      </div>

      {/* Tab Navigation - URL-driven so Progress/Report links from cohorts list work */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-1 bg-och-midnight/50 p-1.5 rounded-xl border border-och-steel/20">
          {[
            { id: 'overview' as TabId, label: 'Overview', icon: TrendingUp },
            { id: 'students' as TabId, label: 'Students', icon: Users },
            { id: 'progress' as TabId, label: 'Progress', icon: BookOpen },
            { id: 'reports' as TabId, label: 'Reports', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-och-defender text-white shadow-sm'
                    : 'text-och-steel hover:text-white hover:bg-och-steel/10'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && cohort && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cohort Details */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Cohort Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-och-steel">Cohort Name:</span>
                  <span className="text-white font-semibold">{cohort.cohort_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Track:</span>
                  <span className="text-white font-semibold">Cybersecurity</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Program:</span>
                  <span className="text-white font-semibold">Professional Development</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Status:</span>
                  <Badge variant="mint">Active</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Seat Allocation */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Seat Allocation</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-och-steel">Allocated Seats:</span>
                  <span className="text-white font-semibold">{cohort.seat_utilization?.target_seats || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Filled Seats:</span>
                  <span className="text-white font-semibold">{cohort.seat_utilization?.used_seats || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Utilization:</span>
                  <span className="text-och-mint font-semibold">{cohort.seat_utilization?.utilization_percentage?.toFixed(1) || 0}%</span>
                </div>
                <div className="mt-4">
                  <Button className="w-full" onClick={() => setShowEnrollModal(true)}>
                    Enroll Students
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Financial Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Financial Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-och-steel">Total Investment:</span>
                  <span className="text-white font-semibold">KES {cohort.financial_summary?.total_cost_kes?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Revenue Share:</span>
                  <span className="text-green-400 font-semibold">KES {cohort.financial_summary?.total_revenue_kes?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Net Cost:</span>
                  <span className="text-white font-semibold">KES {cohort.financial_summary?.net_cost_kes?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Budget utilized:</span>
                  <span className="text-och-mint font-semibold">
                    {cohort.financial_summary?.budget_utilization_pct != null
                      ? `${cohort.financial_summary.budget_utilization_pct.toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Completion Metrics */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Progress Overview</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-och-steel">Total Students:</span>
                  <span className="text-white font-semibold">{cohort.completion_metrics?.total_enrolled || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Completed:</span>
                  <span className="text-white font-semibold">{cohort.completion_metrics?.completed_students || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Completion Rate:</span>
                  <span className="text-och-mint font-semibold">{cohort.completion_metrics?.completion_rate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-och-steel">Avg Progress:</span>
                  <span className="text-och-mint font-semibold">{cohort.completion_metrics?.average_completion_percentage?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Sponsored Students ({students.length})</h2>
              <Button onClick={() => setShowEnrollModal(true)}>Enroll Students</Button>
            </div>
            
            {students.length === 0 ? (
              <div className="text-center py-12 text-och-steel">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No students enrolled yet.</p>
                <Button className="mt-4" onClick={() => setShowEnrollModal(true)}>Enroll First Student</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left py-3 px-4 text-sm text-och-steel">Student</th>
                      <th className="text-center py-3 px-4 text-sm text-och-steel">Progress</th>
                      <th className="text-center py-3 px-4 text-sm text-och-steel">Status</th>
                      <th className="text-center py-3 px-4 text-sm text-och-steel">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{student.name}</p>
                            {student.has_employer_consent && (
                              <p className="text-xs text-och-steel">{student.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-och-mint font-semibold">{student.completion_percentage?.toFixed(1) || 0}%</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={student.enrollment_status === 'active' ? 'mint' : 'orange'}>
                            {student.enrollment_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-och-steel">
                          {student.last_activity_at ? new Date(student.last_activity_at).toLocaleDateString() : 'Never'}
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

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Student Progress</h2>
            {students.length === 0 ? (
              <div className="text-center py-12 text-och-steel">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No students to track. Enroll students to see their progress.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-och-steel/20">
                      <th className="text-left py-3 px-4 text-sm text-och-steel">Student</th>
                      <th className="text-center py-3 px-4 text-sm text-och-steel">Progress</th>
                      <th className="text-center py-3 px-4 text-sm text-och-steel">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.student_id} className="border-b border-och-steel/10 hover:bg-och-midnight/50">
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{s.name}</p>
                          {s.email && <p className="text-xs text-och-steel">{s.email}</p>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-och-mint font-semibold">{s.completion_percentage?.toFixed(1) ?? 0}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={s.enrollment_status === 'active' ? 'mint' : 'orange'}>{s.enrollment_status}</Badge>
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

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Generate Report</h2>
            <p className="text-och-steel text-sm mb-6">Download a report of enrolled students in this cohort.</p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                className="h-16 px-6 flex items-center gap-3"
                onClick={() => handleExportReport('csv')}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span>Download CSV</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 px-6 flex items-center gap-3"
                onClick={() => handleExportReport('json')}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                <span>Download JSON</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showEnrollModal && (
        <EnrollStudentsModal
          cohortId={cohortId}
          cohortName={cohort?.cohort_name || 'Cohort'}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => {
            setShowEnrollModal(false)
            loadCohortData()
          }}
        />
      )}
    </div>
  )
}