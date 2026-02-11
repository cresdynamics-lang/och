'use client';

import { EmailVerification } from './EmailVerification';
import { PhoneVerification } from './PhoneVerification';
import { PasswordChange } from './PasswordChange';
import { MFASetup } from './MFASetup';
import { SessionManagement } from './SessionManagement';
import type { AccountSettings as AccountSettingsType } from '@/types/sponsor-settings';

interface AccountSettingsProps {
  userId: string;
  data: AccountSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const AccountSettings = ({ userId, data, onUpdate }: AccountSettingsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Account Settings</h2>
        <p className="text-och-steel text-sm">
          Manage your account security, authentication, and session settings
        </p>
      </div>

      <section aria-labelledby="email-heading">
        <EmailVerification
          email={data.email.address}
          verified={data.email.verified}
          verifiedAt={data.email.verifiedAt}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { email: { ...data.email, ...updates } })}
        />
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="phone-heading">
        <PhoneVerification
          phone={data.phone.number}
          verified={data.phone.verified}
          verifiedAt={data.phone.verifiedAt}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { phone: { ...data.phone, ...updates } })}
        />
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="password-heading">
        <PasswordChange
          lastChanged={data.password.lastChanged}
          requiresChange={data.password.requiresChange}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { password: { ...data.password, ...updates } })}
        />
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="mfa-heading">
        <MFASetup
          enabled={data.mfa.enabled}
          methods={data.mfa.methods}
          backupCodes={data.mfa.backupCodes}
          userId={userId}
          onUpdate={(updates) => onUpdate('account', { mfa: { ...data.mfa, ...updates } })}
        />
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="sessions-heading">
        <SessionManagement
          sessions={data.sessions}
          userId={userId}
          onUpdate={() => onUpdate('account', {})}
        />
      </section>
    </div>
  );
};

