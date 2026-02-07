'use client';

import { ProfileVisibility } from './ProfileVisibility';
import { DataSharing } from './DataSharing';
import { GDPRSettings } from './GDPRSettings';
import { AuditLog } from './AuditLog';
import type { PrivacySettings as PrivacySettingsType } from '@/types/analyst-settings';

interface PrivacySettingsProps {
  userId: string;
  data: PrivacySettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const PrivacySettings = ({ userId, data, onUpdate }: PrivacySettingsProps) => {
  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <section aria-labelledby="visibility-heading">
        <ProfileVisibility
          visibility={data.profileVisibility}
          userId={userId}
          onUpdate={(updates) => onUpdate('privacy', {
            profileVisibility: { ...data.profileVisibility, ...updates }
          })}
        />
      </section>

      {/* Data Sharing */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="sharing-heading">
        <DataSharing
          dataSharing={data.dataSharing}
          userId={userId}
          onUpdate={(updates) => onUpdate('privacy', {
            dataSharing: { ...data.dataSharing, ...updates }
          })}
        />
      </section>

      {/* GDPR Settings */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="gdpr-heading">
        <GDPRSettings
          gdpr={data.gdpr}
          userId={userId}
          onUpdate={(updates) => onUpdate('privacy', {
            gdpr: { ...data.gdpr, ...updates }
          })}
        />
      </section>

      {/* Audit Log */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="audit-heading">
        <AuditLog
          auditLog={data.auditLog}
          userId={userId}
        />
      </section>
    </div>
  );
};

