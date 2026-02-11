'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Lock, Shield, FileText } from 'lucide-react';
import type { PrivacySettings as PrivacySettingsType } from '@/types/sponsor-settings';

interface PrivacySettingsProps {
  userId: string;
  data: PrivacySettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const PrivacySettings = ({ userId, data, onUpdate }: PrivacySettingsProps) => {
  const handleToggle = async (key: string, value: boolean) => {
    try {
      await onUpdate('privacy', {
        dataSharing: { ...data.dataSharing, [key]: value }
      });
    } catch (error) {
      alert('Failed to update privacy settings');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Privacy & Consent</h2>
        <p className="text-och-steel-grey text-sm">
          Manage data sharing preferences and privacy settings
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-och-defender-blue" />
          Data Sharing
        </h3>
        <div className="space-y-4 p-4 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Share with Employers</div>
              <div className="text-sm text-och-steel-grey">Allow employers to view student data</div>
            </div>
            <Switch
              checked={data.dataSharing.shareWithEmployers}
              onCheckedChange={(checked) => handleToggle('shareWithEmployers', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Share Analytics</div>
              <div className="text-sm text-och-steel-grey">Share aggregated analytics data</div>
            </div>
            <Switch
              checked={data.dataSharing.shareAnalytics}
              onCheckedChange={(checked) => handleToggle('shareAnalytics', checked)}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-och-defender-blue" />
          GDPR & Data Rights
        </h3>
        <div className="space-y-4 p-4 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Data Export</div>
              <div className="text-sm text-och-steel-grey">Enable data export functionality</div>
            </div>
            <Switch checked={data.gdpr.dataExportEnabled} disabled />
          </div>
          <div>
            <div className="text-white font-medium mb-2">Data Retention</div>
            <div className="text-sm text-och-steel-grey">
              Data will be retained for {data.gdpr.dataRetentionDays} days
            </div>
          </div>
        </div>
      </section>

      {data.auditLog.length > 0 && (
        <section className="border-t border-och-steel-grey/30 pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-och-defender-blue" />
            Audit Log
          </h3>
          <div className="space-y-2">
            {data.auditLog.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20 text-sm"
              >
                <div className="text-white">{log.action}</div>
                <div className="text-och-steel-grey text-xs mt-1">
                  {new Date(log.timestamp).toLocaleString()} • {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

