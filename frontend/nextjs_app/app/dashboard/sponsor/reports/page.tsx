'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface ReportRequest {
  id: string
  request_type: 'graduate_breakdown' | 'roi_projection' | 'cohort_analytics' | 'custom'
  cohort_id?: string
  details?: any
  status: 'pending' | 'delivered' | 'cancelled'
  created_at: string
  delivered_at?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({
    request_type: 'graduate_breakdown' as const,
    cohort_id: '',
    details: '',
  })

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoint
      // const data = await sponsorClient.getReportRequests()
      // setReports(data)
      setReports([])
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReport = async () => {
    try {
      // TODO: Implement report request API
      // await sponsorClient.requestDirectorReport(requestForm)
      console.log('Request report:', requestForm)
      alert('Report request feature coming soon')
      setShowRequestModal(false)
      setRequestForm({ request_type: 'graduate_breakdown', cohort_id: '', details: '' })
      loadReports()
    } catch (error) {
      console.error('Failed to request report:', error)
    }
  }

  const statusColors = {
    pending: 'bg-och-gold/20 text-och-gold',
    delivered: 'bg-och-mint/20 text-och-mint',
    cancelled: 'bg-och-steel/20 text-och-steel',
  }

  const reportTypeLabels = {
    graduate_breakdown: 'Graduate Breakdown',
    roi_projection: 'ROI Projection',
    cohort_analytics: 'Cohort Analytics',
    custom: 'Custom Report',
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">📊 Custom Reports</h1>
        <p className="text-och-steel">
          Request detailed analytics from Program Director
        </p>
      </div>
      
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors font-semibold"
        >
          + Request Report
        </button>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-white">Request Custom Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-och-steel mb-2">
                  Report Type
                </label>
                <select
                  value={requestForm.request_type}
                  onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:ring-2 focus:ring-och-defender focus:border-och-defender"
                >
                  <option value="graduate_breakdown">Graduate Breakdown</option>
                  <option value="roi_projection">ROI Projection</option>
                  <option value="cohort_analytics">Cohort Analytics</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-och-steel mb-2">
                  Cohort (Optional)
                </label>
                <input
                  type="text"
                  value={requestForm.cohort_id}
                  onChange={(e) => setRequestForm({ ...requestForm, cohort_id: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:ring-2 focus:ring-och-defender focus:border-och-defender"
                  placeholder="Cohort ID or name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-och-steel mb-2">
                  Additional Details
                </label>
                <textarea
                  value={requestForm.details}
                  onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:ring-2 focus:ring-och-defender focus:border-och-defender"
                  rows={4}
                  placeholder="Specify any additional requirements..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestReport}
                  className="flex-1 px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors font-semibold"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => {
                    setShowRequestModal(false)
                    setRequestForm({ request_type: 'graduate_breakdown', cohort_id: '', details: '' })
                  }}
                  className="px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-midnight/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-och-midnight border-b border-och-steel/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Report Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Cohort
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-och-midnight divide-y divide-och-steel/20">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-och-steel">
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-och-steel">
                    No report requests found. Request your first custom report.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-och-midnight/80">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                      {reportTypeLabels[report.request_type]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                      {report.cohort_id || 'All Cohorts'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[report.status]}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {report.status === 'delivered' ? (
                        <button className="text-och-mint hover:text-och-mint/80 font-semibold">
                          Download
                        </button>
                      ) : (
                        <button className="text-och-steel cursor-not-allowed">
                          Pending
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
