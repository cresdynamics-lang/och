'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface Employee {
  id: string
  email: string
  name?: string
  seat_status: 'pending' | 'assigned' | 'enrolled' | 'inactive'
  preferred_track?: string
  cohort_id?: string
  assigned_at?: string
}

export default function EmployeeRosterPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showBulkInvite, setShowBulkInvite] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoint
      // const data = await sponsorClient.getEmployees()
      // setEmployees(data)
      setEmployees([])
    } catch (error) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkInvite = async () => {
    if (!csvFile) return
    
    try {
      // TODO: Implement bulk invite API
      console.log('Bulk invite with file:', csvFile.name)
      alert('Bulk invite feature coming soon')
    } catch (error) {
      console.error('Failed to bulk invite:', error)
    }
  }

  const statusColors = {
    pending: 'bg-och-gold/20 text-och-gold',
    assigned: 'bg-och-defender/20 text-och-defender',
    enrolled: 'bg-och-mint/20 text-och-mint',
    inactive: 'bg-och-steel/20 text-och-steel',
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">👥 Employee Roster</h1>
        <p className="text-och-steel">
          Manage sponsored employee enrollments
        </p>
      </div>
      
      <div className="mb-6 flex justify-end gap-3">
        <button
          onClick={() => setShowBulkInvite(!showBulkInvite)}
          className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors font-semibold"
        >
          📧 Bulk Invite
        </button>
        <button className="px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-midnight/80 transition-colors font-semibold">
          Export CSV
        </button>
      </div>

      {/* Bulk Invite Modal */}
      {showBulkInvite && (
        <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-white">Bulk Employee Invite</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-och-steel mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-och-steel file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-och-defender file:text-white hover:file:bg-och-defender/80"
              />
              <p className="text-xs text-och-steel mt-1">
                CSV format: email, name, preferred_track (optional)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBulkInvite}
                disabled={!csvFile}
                className="px-4 py-2 bg-och-mint text-och-midnight rounded-lg hover:bg-och-mint/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Invites
              </button>
              <button
                onClick={() => setShowBulkInvite(false)}
                className="px-4 py-2 border border-och-steel/20 text-och-steel rounded-lg hover:bg-och-midnight/80 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-och-midnight border-b border-och-steel/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Track
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Assigned
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
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-och-steel">
                    No employees found. Use Bulk Invite to add employees.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-och-midnight/80">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-white">
                          {employee.name || 'N/A'}
                        </div>
                        <div className="text-sm text-och-steel">{employee.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[employee.seat_status]}`}>
                        {employee.seat_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                      {employee.preferred_track || 'Any'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                      {employee.assigned_at ? new Date(employee.assigned_at).toLocaleDateString() : 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-och-mint hover:text-och-mint/80 font-semibold">
                        Assign Seat
                      </button>
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
