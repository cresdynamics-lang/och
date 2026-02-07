'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Phone, CheckCircle2, XCircle } from 'lucide-react';

interface PhoneVerificationProps {
  phone: string | null;
  verified: boolean;
  verifiedAt: string | null;
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const PhoneVerification = ({ phone, verified, verifiedAt, userId, onUpdate }: PhoneVerificationProps) => {
  const [showForm, setShowForm] = useState(false);
  const [newPhone, setNewPhone] = useState(phone || '');

  const handleSave = async () => {
    try {
      await onUpdate({ number: newPhone, verified: false, verifiedAt: null });
      setShowForm(false);
    } catch (error) {
      alert('Failed to update phone number');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 id="phone-heading" className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Phone className="w-5 h-5 text-och-defender-blue" />
          Phone Number
        </h3>
        <p className="text-sm text-och-steel">
          Add a phone number for SMS notifications and account recovery
        </p>
      </div>

      {!showForm ? (
        <div className="flex items-center justify-between p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">{phone || 'No phone number added'}</span>
            {phone && verified && (
              <Badge variant="mint" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            {phone ? 'Edit' : 'Add Phone'}
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20 space-y-3">
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => {
              setShowForm(false);
              setNewPhone(phone || '');
            }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

