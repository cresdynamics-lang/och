'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Mail, CheckCircle2, XCircle, Send } from 'lucide-react';

interface EmailVerificationProps {
  email: {
    primary: string;
    verified: boolean;
    verificationDate?: string;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const EmailVerification = ({ email, userId, onUpdate }: EmailVerificationProps) => {
  const [isResending, setIsResending] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const handleResend = async () => {
    setIsResending(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/account/verify-email`, {
        method: 'POST',
      });
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      alert('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      await onUpdate({ primary: newEmail, verified: false });
      setShowChangeForm(false);
      setNewEmail('');
      alert('Email updated. Please verify your new email address.');
    } catch (error) {
      alert('Failed to update email');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">{email.primary}</div>
            {email.verified ? (
              <div className="text-sm text-och-cyber-mint flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified {email.verificationDate && new Date(email.verificationDate).toLocaleDateString()}
              </div>
            ) : (
              <div className="text-sm text-och-signal-orange flex items-center gap-1 mt-1">
                <XCircle className="w-3 h-3" />
                Not verified
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!email.verified && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResend}
              disabled={isResending}
            >
              <Send className="w-4 h-4 mr-2" />
              {isResending ? 'Sending...' : 'Resend'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowChangeForm(!showChangeForm)}
          >
            Change Email
          </Button>
        </div>
      </div>

      {showChangeForm && (
        <div className="p-4 bg-och-steel-grey/10 border border-och-defender-blue/30 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
              aria-label="New email address"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleChangeEmail}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setShowChangeForm(false);
              setNewEmail('');
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

