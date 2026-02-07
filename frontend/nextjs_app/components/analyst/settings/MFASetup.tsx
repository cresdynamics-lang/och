'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Shield, Smartphone, Mail } from 'lucide-react';

interface MFASetupProps {
  mfa: {
    enabled: boolean;
    method: 'totp' | 'sms' | null;
    totpSecret?: string;
    qrCode?: string;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const MFASetup = ({ mfa, userId, onUpdate }: MFASetupProps) => {
  const [showSetup, setShowSetup] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms'>('totp');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      setShowSetup(true);
    } else {
      if (!confirm('Are you sure you want to disable MFA? This reduces your account security.')) {
        return;
      }
      setIsEnabling(true);
      try {
        await fetch(`/api/analyst/${userId}/settings/account/disable-mfa`, {
          method: 'POST',
        });
        await onUpdate({ enabled: false, method: null });
      } catch (error) {
        alert('Failed to disable MFA');
      } finally {
        setIsEnabling(false);
      }
    }
  };

  const handleEnable = async () => {
    if (!verificationCode) {
      alert('Please enter the verification code');
      return;
    }

    setIsEnabling(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/account/enable-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: selectedMethod,
          code: verificationCode,
        }),
      });
      await onUpdate({ enabled: true, method: selectedMethod });
      setShowSetup(false);
      setVerificationCode('');
      alert('MFA enabled successfully');
    } catch (error) {
      alert('Failed to enable MFA. Please check your verification code.');
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div>
          <div className="font-medium flex items-center gap-2">
            <Shield className="w-5 h-5 text-och-defender-blue" />
            Multi-Factor Authentication
          </div>
          <div className="text-sm text-och-steel-grey mt-1">
            {mfa.enabled
              ? `Enabled via ${selectedMethod === 'totp' ? 'Authenticator App' : 'SMS'}`
              : 'Add an extra layer of security to your account'}
          </div>
        </div>
        <Switch
          checked={mfa.enabled}
          onCheckedChange={handleToggle}
          disabled={isEnabling}
        />
      </div>

      {showSetup && !mfa.enabled && (
        <div className="p-4 bg-och-steel-grey/10 border border-och-defender-blue/30 rounded-lg space-y-4">
          <div>
            <div className="text-sm font-medium mb-3">Choose Authentication Method</div>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedMethod('totp')}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  selectedMethod === 'totp'
                    ? 'border-och-defender-blue bg-och-defender-blue/10'
                    : 'border-och-steel-grey/30 bg-och-steel-grey/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-och-defender-blue" />
                  <div>
                    <div className="font-medium">Authenticator App</div>
                    <div className="text-xs text-och-steel-grey">Use Google Authenticator or similar</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('sms')}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  selectedMethod === 'sms'
                    ? 'border-och-defender-blue bg-och-defender-blue/10'
                    : 'border-och-steel-grey/30 bg-och-steel-grey/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-och-defender-blue" />
                  <div>
                    <div className="font-medium">SMS</div>
                    <div className="text-xs text-och-steel-grey">Receive codes via text message</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {selectedMethod === 'totp' && (
            <div className="space-y-3">
              <div className="text-sm text-och-steel-grey">
                1. Scan this QR code with your authenticator app
              </div>
              {mfa.qrCode ? (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={mfa.qrCode} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="p-8 bg-och-steel-grey/20 rounded-lg text-center text-och-steel-grey">
                  QR Code will appear here
                </div>
              )}
              {mfa.totpSecret && (
                <div className="text-xs text-och-steel-grey">
                  Or enter this code manually: <code className="bg-och-midnight-black px-2 py-1 rounded">{mfa.totpSecret}</code>
                </div>
              )}
              <div className="text-sm text-och-steel-grey">
                2. Enter the 6-digit code from your app
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={selectedMethod === 'totp' ? '000000' : 'Enter SMS code'}
              maxLength={6}
              className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
              aria-label="Verification code"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleEnable} disabled={isEnabling || verificationCode.length !== 6}>
              {isEnabling ? 'Enabling...' : 'Enable MFA'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSetup(false);
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

