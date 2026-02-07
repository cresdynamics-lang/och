'use client'

import { useState, useEffect } from 'react'
import { sponsorClient, type OrganizationMemberItem } from '@/services/sponsorClient'

export default function TeamManagementPage() {
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [members, setMembers] = useState<OrganizationMemberItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' as const })

  useEffect(() => {
    loadProfileAndTeam()
  }, [])

  const loadProfileAndTeam = async () => {
    try {
      setLoading(true)
      setError(null)
      const profile = await sponsorClient.getProfile()
      const orgs = profile?.sponsor_organizations ?? []
      const slug = orgs[0]?.slug ?? null
      setOrgSlug(slug)
      if (slug) {
        const list = await sponsorClient.getTeamMembers(slug)
        setMembers(Array.isArray(list) ? list : [])
      } else {
        setMembers([])
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load team'
      setError(msg)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const loadTeam = () => {
    if (orgSlug) {
      sponsorClient.getTeamMembers(orgSlug).then((list) => {
        setMembers(Array.isArray(list) ? list : [])
      }).catch(() => setMembers([]))
    }
  }

  const handleInvite = async () => {
    if (!orgSlug || !inviteForm.email.trim()) return
    try {
      setSubmitting(true)
      setError(null)
      const org_role = inviteForm.role === 'admin' ? 'admin' : inviteForm.role === 'finance' ? 'member' : 'viewer'
      await sponsorClient.inviteTeamMember({
        org_slug: orgSlug,
        email: inviteForm.email.trim(),
        org_role,
        system_role: inviteForm.role === 'admin' ? 'sponsor_admin' : undefined,
      })
      setShowInviteModal(false)
      setInviteForm({ email: '', role: 'viewer' })
      loadTeam()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send invite'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-och-gold/20 text-och-gold',
    viewer: 'bg-och-defender/20 text-och-defender',
    member: 'bg-och-mint/20 text-och-mint',
    finance: 'bg-och-mint/20 text-och-mint',
  }

  const displayRole = (role: string) => (role === 'member' ? 'Member' : role.charAt(0).toUpperCase() + role.slice(1))

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:pl-0 lg:pr-6 xl:pr-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">👥 Team Management</h1>
        <p className="text-och-steel">
          Manage team member access and permissions. Invites are sent via email (OCH mail config).
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
      
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={!orgSlug}
          className="px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!inviteForm.email.trim() || submitting || !orgSlug}
                  className="flex-1 px-4 py-2 bg-och-defender text-white rounded-lg hover:bg-och-defender/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Invite'}
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
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-och-midnight divide-y divide-och-steel/20">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-och-steel">
                    Loading team members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-och-steel">
                    No team members found. Invite your first team member to get started.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const name = [member.user?.first_name, member.user?.last_name].filter(Boolean).join(' ') || member.user?.email || 'N/A'
                  return (
                    <tr key={String(member.id)} className="hover:bg-och-midnight/80">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-white">{name}</div>
                          <div className="text-sm text-och-steel">{member.user?.email ?? ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[member.role] ?? 'bg-och-steel/20 text-och-steel'}`}>
                          {displayRole(member.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-och-steel">
                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
