'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Phone, CheckCircle2, XCircle, Send } from 'lucide-react';

interface PhoneVerificationProps {
  phone: {
    number: string;
    verified: boolean;
    sms2faEnabled: boolean;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const PhoneVerification = ({ phone, userId, onUpdate }: PhoneVerificationProps) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [newPhone, setNewPhone] = useState(phone.number);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/account/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone }),
      });
      alert('Verification code sent via SMS');
    } catch (error) {
      alert('Failed to send verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/account/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      await onUpdate({ number: newPhone, verified: true });
      setShowEditForm(false);
      setVerificationCode('');
      alert('Phone number verified successfully');
    } catch (error) {
      alert('Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleSMS2FA = async (enabled: boolean) => {
    if (!phone.verified && enabled) {
      alert('Please verify your phone number first');
      return;
    }
    await onUpdate({ sms2faEnabled: enabled });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">{phone.number}</div>
            {phone.verified ? (
              <div className="text-sm text-och-cyber-mint flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </div>
            ) : (
              <div className="text-sm text-och-signal-orange flex items-center gap-1 mt-1">
                <XCircle className="w-3 h-3" />
                Not verified
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowEditForm(!showEditForm)}
        >
          {phone.number ? 'Edit' : 'Add Phone'}
        </Button>
      </div>

      {/* SMS 2FA Toggle */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div>
          <div className="font-medium">SMS Two-Factor Authentication</div>
          <div className="text-sm text-och-steel-grey mt-1">
            Use SMS codes for additional security
          </div>
        </div>
        <Switch
          checked={phone.sms2faEnabled}
          onCheckedChange={handleToggleSMS2FA}
          disabled={!phone.verified}
        />
      </div>

      {showEditForm && (
        <div className="p-4 bg-och-steel-grey/10 border border-och-defender-blue/30 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+2547xxxxxxxx"
              className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
              aria-label="Phone number"
            />
          </div>

          {!phone.verified && (
            <>
              <Button
                size="sm"
                onClick={handleSendCode}
                disabled={isSendingCode}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSendingCode ? 'Sending...' : 'Send Verification Code'}
              </Button>

              <div>
                <label className="block text-sm font-medium mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
                  aria-label="Verification code"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={phone.verified ? handleVerifyCode : handleVerifyCode}
              disabled={isVerifying || (!phone.verified && !verificationCode)}
            >
              {phone.verified ? 'Save' : 'Verify & Save'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowEditForm(false);
                setNewPhone(phone.number);
                setVerificationCode('');
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

