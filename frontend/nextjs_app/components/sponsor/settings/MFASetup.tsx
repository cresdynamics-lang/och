'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shield, Smartphone } from 'lucide-react';

interface MFASetupProps {
  enabled: boolean;
  methods: Array<'totp' | 'sms'>;
  backupCodes: number;
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const MFASetup = ({ enabled, methods, backupCodes, userId, onUpdate }: MFASetupProps) => {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleToggle = async () => {
    setIsEnabling(true);
    try {
      await onUpdate({ enabled: !enabled });
    } catch (error) {
      alert('Failed to update MFA settings');
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 id="mfa-heading" className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-och-defender" />
          Multi-Factor Authentication
        </h3>
        <p className="text-sm text-och-steel">
          Add an extra layer of security to your account
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Badge variant="mint">Enabled</Badge>
          ) : (
            <Badge variant="orange">Disabled</Badge>
          )}
          {methods.length > 0 && (
            <span className="text-sm text-och-steel">
              {methods.map(m => m.toUpperCase()).join(', ')}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={enabled ? 'outline' : 'default'}
          onClick={handleToggle}
          disabled={isEnabling}
        >
          {isEnabling ? 'Updating...' : enabled ? 'Disable MFA' : 'Enable MFA'}
        </Button>
      </div>

      {enabled && backupCodes > 0 && (
        <p className="text-xs text-och-steel">
          {backupCodes} backup codes remaining
        </p>
      )}
    </div>
  );
};

