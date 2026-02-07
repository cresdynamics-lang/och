'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordChangeProps {
  password: {
    lastChanged?: string;
    strength?: 'weak' | 'medium' | 'strong';
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const PasswordChange = ({ password, userId, onUpdate }: PasswordChangeProps) => {
  const [showForm, setShowForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [isChanging, setIsChanging] = useState(false);

  const calculateStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 8) return 'weak';
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return 'strong';
    }
    return 'medium';
  };

  const handlePasswordChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'newPassword') {
      setPasswordStrength(calculateStrength(value));
    }
  };

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (passwordStrength === 'weak') {
      alert('Password is too weak. Please use a stronger password.');
      return;
    }

    setIsChanging(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/account/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      await onUpdate({ lastChanged: new Date().toISOString(), strength: passwordStrength });
      setShowForm(false);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully');
    } catch (error) {
      alert('Failed to change password. Please check your current password.');
    } finally {
      setIsChanging(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong':
        return 'bg-och-cyber-mint';
      case 'medium':
        return 'bg-och-sahara-gold';
      default:
        return 'bg-och-signal-orange';
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 'strong':
        return 'Strong';
      case 'medium':
        return 'Medium';
      default:
        return 'Weak';
    }
  };

  return (
    <div className="space-y-4">
      {password.lastChanged && (
        <div className="text-sm text-och-steel-grey">
          Last changed: {new Date(password.lastChanged).toLocaleDateString()}
        </div>
      )}

      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>
          <Lock className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      ) : (
        <div className="p-4 bg-och-steel-grey/10 border border-och-defender-blue/30 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
                aria-label="Current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-och-steel-grey hover:text-white"
                aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
                aria-label="New password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-och-steel-grey hover:text-white"
                aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-och-steel-grey/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all`}
                      style={{ width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '66%' : '33%' }}
                    ></div>
                  </div>
                  <span className={`text-xs ${passwordStrength === 'strong' ? 'text-och-cyber-mint' : passwordStrength === 'medium' ? 'text-och-sahara-gold' : 'text-och-signal-orange'}`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="text-xs text-och-steel-grey">
                  Use at least 8 characters with uppercase, lowercase, numbers, and symbols
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
                aria-label="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-och-steel-grey hover:text-white"
                aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <div className="text-xs text-och-signal-orange mt-1">Passwords do not match</div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isChanging || passwordStrength === 'weak' || formData.newPassword !== formData.confirmPassword}>
              {isChanging ? 'Changing...' : 'Change Password'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

