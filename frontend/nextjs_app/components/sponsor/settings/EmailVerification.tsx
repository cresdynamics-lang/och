'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Mail, CheckCircle2, XCircle, Send } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  verified: boolean;
  verifiedAt: string | null;
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const EmailVerification = ({ email, verified, verifiedAt, userId, onUpdate }: EmailVerificationProps) => {
  const [isResending, setIsResending] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const handleResend = async () => {
    setIsResending(true);
    try {
      await fetch(`/api/sponsor/settings/verify-email`, {
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
      await onUpdate({ address: newEmail, verified: false, verifiedAt: null });
      setShowChangeForm(false);
      setNewEmail('');
      alert('Email updated. Please verify your new email address.');
    } catch (error) {
      alert('Failed to update email');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 id="email-heading" className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Mail className="w-5 h-5 text-och-defender-blue" />
          Email Address
        </h3>
        <p className="text-sm text-och-steel">
          Your email address is used for account notifications and password recovery
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">{email}</span>
          {verified ? (
            <Badge variant="mint" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="orange" className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Unverified
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!verified && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResend}
              disabled={isResending}
            >
              <Send className="w-4 h-4 mr-1" />
              {isResending ? 'Sending...' : 'Resend Verification'}
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
        <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20 space-y-3">
          <input
            type="email"
            placeholder="Enter new email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleChangeEmail}>
              Update Email
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

      {verifiedAt && (
        <p className="text-xs text-och-steel">
          Verified on {new Date(verifiedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

