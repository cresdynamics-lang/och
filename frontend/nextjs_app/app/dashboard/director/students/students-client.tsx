'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Link, Search, Filter, UserPlus } from 'lucide-react'

interface Student {
  id: string
  uuid_id: string
  email: string
  first_name: string
  last_name: string
  sponsor_id?: string
  sponsor_name?: string
  created_at: string
}

interface Sponsor {
  id: string
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

  useEffect(() => {
    fetchStudents()
    fetchSponsors()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/director/students/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchSponsors = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/?role=sponsor', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSponsors(data.results || [])
      }
    } catch (error) {
      console.error('Failed to fetch sponsors:', error)
    } finally {
      setLoading(false)
    }
  }

  const linkStudentsToSponsor = async () => {
    if (!selectedSponsor || selectedStudents.length === 0) return

    try {
      const response = await fetch('http://localhost:8000/api/v1/director/students/link-sponsor/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          student_ids: selectedStudents,
          sponsor_id: selectedSponsor
        })
      })

      if (response.ok) {
        await fetchStudents()
        setSelectedStudents([])
        setShowLinkModal(false)
        setSelectedSponsor('')
      }
    } catch (error) {
      console.error('Failed to link students to sponsor:', error)
    }
  }

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
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Sponsor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-och-steel">Joined</th>
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
                    {student.sponsor_name ? (
                      <span className="px-2 py-1 bg-och-defender/20 text-och-mint rounded text-sm">
                        {student.sponsor_name}
                      </span>
                    ) : (
                      <span className="text-och-steel text-sm">Not linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-och-steel text-sm">
                    {new Date(student.created_at).toLocaleDateString()}
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
                    <option key={sponsor.uuid_id} value={sponsor.uuid_id}>
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
    </div>
  )
}