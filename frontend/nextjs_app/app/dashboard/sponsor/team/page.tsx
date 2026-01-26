'use client'

import { useState, useEffect } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

interface TeamMember {
  id: string
  email: string
  name?: string
  role: 'admin' | 'viewer' | 'finance'
  status: 'active' | 'invited' | 'inactive'
  invited_at?: string
  last_active?: string
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' as const })

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    try {
      setLoading(true)
      // TODO: Implement API endpoint
      // const data = await sponsorClient.getTeamMembers()
      // setMembers(data)
      setMembers([])
    } catch (error) {
      console.error('Failed to load team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      // TODO: Implement invite API
      console.log('Invite team member:', inviteForm)
      alert('Team invite feature coming soon')
      setShowInviteModal(false)
      setInviteForm({ email: '', role: 'viewer' })
    } catch (error) {
      console.error('Failed to invite member:', error)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    try {
      // TODO: Implement remove API
      console.log('Remove member:', memberId)
      alert('Remove member feature coming soon')
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const roleColors = {
    admin: 'bg-och-gold/20 text-och-gold',
    viewer: 'bg-och-defender/20 text-och-defender',
    finance: 'bg-och-mint/20 text-och-mint',
  }

  const statusColors = {
    active: 'bg-och-mint/20 text-och-mint',
    invited: 'bg-och-gold/20 text-och-gold',
    inactive: 'bg-och-steel/20 text-och-steel',
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">👥 Team Management</h1>
        <p className="text-och-steel">
          Manage team member access and permissions
        </p>
      </div>
      
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors font-semibold"
        >
          + Invite Member
        </button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-white">Invite Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-och-steel mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:ring-2 focus:ring-och-defender focus:border-och-defender"
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-och-steel mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:ring-2 focus:ring-och-defender focus:border-och-defender"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="finance">Finance - Billing & invoices</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleInvite}
                  disabled={!inviteForm.email}
                  className="flex-1 px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invite
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteForm({ email: '', role: 'viewer' })
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

      {/* Team Members Table */}
      <div className="bg-och-midnight border border-och-steel/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-och-midnight border-b border-och-steel/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-och-steel uppercase tracking-wider">
                  Last Active
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
                    Loading team members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-och-steel">
                    No team members found. Invite your first team member to get started.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-och-midnight/80">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-white">
                          {member.name || 'N/A'}
                        </div>
                        <div className="text-sm text-och-steel">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[member.role]}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[member.status]}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                      {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="text-och-orange hover:text-och-orange/80 font-semibold"
                      >
                        Remove
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
