'use client'

import { useState, useEffect } from 'react'
import { sponsorClient, type SponsoredStudentListItem } from '@/services/sponsorClient'
import Link from 'next/link'

export default function SponsoredStudentsPage() {
  const [students, setStudents] = useState<SponsoredStudentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await sponsorClient.getStudents()
      setStudents(data)
    } catch (err: any) {
      // Extract error details
      const errorStatus = err?.status || err?.response?.status || 0;
      const errorMessage = err?.message || err?.data?.detail || err?.data?.error || 'Failed to load sponsored students';
      
      // Check if it's a connection/network error or API endpoint doesn't exist
      const isConnectionError = errorMessage.includes('fetch failed') ||
                               errorMessage.includes('Failed to fetch') ||
                               errorMessage.includes('NetworkError') ||
                               errorMessage.includes('ECONNREFUSED') ||
                               errorMessage.includes('Cannot connect to backend server');
      
      const isNotFoundError = errorStatus === 404 ||
                             errorMessage.includes('404') ||
                             errorMessage.includes('Not Found');
      
      // For 404s or connection errors, show empty state instead of error
      if (isNotFoundError || isConnectionError) {
        setStudents([]); // Show empty state
        setError(null); // Don't show error message
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-och-mint/20 text-och-mint'
      case 'completed': return 'bg-och-defender/20 text-och-defender'
      case 'at_risk': return 'bg-red-500/20 text-red-400'
      case 'inactive': return 'bg-och-steel/20 text-och-steel'
      default: return 'bg-och-gold/20 text-och-gold'
    }
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">👥 Sponsored Students</h1>
        <p className="text-och-steel">
          View all sponsored students and track their enrollment status and progress.
        </p>
      </div>
      
      <div className="mb-6 flex justify-end gap-3">
        <button className="px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-midnight/80 transition-colors font-semibold">
          Export Report
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-och-midnight border-b border-och-steel/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Cohort
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Readiness
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Portfolio
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-och-midnight divide-y divide-och-steel/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-och-steel">
                    Loading sponsored students...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-red-400">
                    Error: {error}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-och-steel">
                    No sponsored students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-och-midnight/80">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-white">
                          {student.consent_employer_share ? student.name : `Student #${student.id.slice(-4)}`}
                        </div>
                        <div className="text-sm text-och-steel">
                          {student.consent_employer_share ? student.email : 'Email hidden'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-semibold">{student.cohort_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.enrollment_status)}`}>
                        {student.enrollment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-semibold">
                        {student.completion_pct?.toFixed(1) || 'N/A'}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-semibold">
                        {student.readiness_score?.toFixed(1) || 'N/A'}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-semibold">
                        {student.portfolio_items} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {student.consent_employer_share ? (
                        <>
                          <Link
                            href={`/dashboard/sponsor/students/${student.id}`}
                            className="text-och-mint hover:text-och-mint/80 font-semibold"
                          >
                            View Profile
                          </Link>
                          <Link
                            href={`/dashboard/sponsor/students/${student.id}/milestones`}
                            className="text-och-defender hover:text-och-defender/80 font-semibold"
                          >
                            Milestones
                          </Link>
                        </>
                      ) : (
                        <span className="text-och-steel text-xs">Consent required</span>
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
