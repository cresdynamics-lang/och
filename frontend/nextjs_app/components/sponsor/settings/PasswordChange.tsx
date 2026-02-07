'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordChangeProps {
  lastChanged: string | null;
  requiresChange: boolean;
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const PasswordChange = ({ lastChanged, requiresChange, userId, onUpdate }: PasswordChangeProps) => {
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsUpdating(true);
    try {
      await fetch('/api/sponsor/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      await onUpdate({ lastChanged: new Date().toISOString(), requiresChange: false });
      setShowForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully');
    } catch (error) {
      alert('Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 id="password-heading" className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Lock className="w-5 h-5 text-och-defender-blue" />
          Password
        </h3>
        <p className="text-sm text-och-steel">
          Change your account password. Use a strong, unique password.
        </p>
      </div>

      {!showForm ? (
        <div className="flex items-center justify-between p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
          <div>
            <span className="text-white">••••••••</span>
            {lastChanged && (
              <p className="text-xs text-och-steel mt-1">
                Last changed {new Date(lastChanged).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            Change Password
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-och-steel hover:text-white"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleChangePassword} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Password'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setShowForm(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

