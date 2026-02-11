'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users, UserPlus, Mail } from 'lucide-react';
import type { TeamSettings as TeamSettingsType } from '@/types/sponsor-settings';

interface TeamSettingsProps {
  userId: string;
  data: TeamSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const TeamSettings = ({ userId, data, onUpdate }: TeamSettingsProps) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'viewer'>('viewer');

  const handleInvite = async () => {
    try {
      await fetch('/api/sponsor/settings/invite-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setShowInviteForm(false);
      setInviteEmail('');
      alert('Invitation sent');
    } catch (error) {
      alert('Failed to send invitation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Team Management</h2>
          <p className="text-och-steel text-sm">
            Manage team members and their access permissions
          </p>
        </div>
        {data.permissions.canInviteMembers && (
          <Button onClick={() => setShowInviteForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {showInviteForm && (
        <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel-grey/20 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel-grey/30 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel-grey/30 rounded-lg text-white"
            >
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInvite}>Send Invitation</Button>
            <Button size="sm" variant="outline" onClick={() => {
              setShowInviteForm(false);
              setInviteEmail('');
            }}>Cancel</Button>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-och-defender-blue" />
          Team Members ({data.members.length})
        </h3>
        {data.members.length === 0 ? (
          <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel-grey/20 text-center text-och-steel">
            No team members yet
          </div>
        ) : (
          <div className="space-y-2">
            {data.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-och-steel/10 rounded-lg border border-och-steel-grey/20"
              >
                <div>
                  <div className="text-white font-medium">{member.name}</div>
                  <div className="text-sm text-och-steel">{member.email}</div>
                </div>
                <Badge variant={member.status === 'active' ? 'mint' : 'orange'}>
                  {member.role} • {member.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.invitations.length > 0 && (
        <section className="border-t border-och-steel-grey/30 pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-och-defender-blue" />
            Pending Invitations ({data.invitations.length})
          </h3>
          <div className="space-y-2">
            {data.invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-och-steel/10 rounded-lg border border-och-steel-grey/20"
              >
                <div>
                  <div className="text-white font-medium">{invitation.email}</div>
                  <div className="text-sm text-och-steel">
                    Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge>{invitation.role}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

