'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Settings as SettingsIcon } from 'lucide-react';
import type { PreferencesSettings as PreferencesSettingsType } from '@/types/sponsor-settings';

interface PreferencesSettingsProps {
  userId: string;
  data: PreferencesSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const PreferencesSettings = ({ userId, data, onUpdate }: PreferencesSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data);

  const handleSave = async () => {
    try {
      await onUpdate('preferences', formData);
      setIsEditing(false);
      alert('Preferences updated');
    } catch (error) {
      alert('Failed to update preferences');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Preferences</h2>
          <p className="text-och-steel-grey text-sm">
            Customize your dashboard and application preferences
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-och-defender-blue" />
          Dashboard Preferences
        </h3>
        <div className="space-y-4 p-4 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Default View</label>
            <select
              value={formData.dashboard.defaultView}
              onChange={(e) => setFormData({ ...formData, dashboard: { ...formData.dashboard, defaultView: e.target.value as any } })}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel-grey/30 rounded-lg text-white disabled:opacity-50"
            >
              <option value="overview">Overview</option>
              <option value="cohorts">Cohorts</option>
              <option value="students">Students</option>
              <option value="reports">Reports</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Items Per Page</label>
            <input
              type="number"
              value={formData.dashboard.itemsPerPage}
              onChange={(e) => setFormData({ ...formData, dashboard: { ...formData.dashboard, itemsPerPage: parseInt(e.target.value) } })}
              disabled={!isEditing}
              min="10"
              max="100"
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel-grey/30 rounded-lg text-white disabled:opacity-50"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Report Preferences</h3>
        <div className="space-y-4 p-4 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Default Format</label>
            <select
              value={formData.reports.defaultFormat}
              onChange={(e) => setFormData({ ...formData, reports: { ...formData.reports, defaultFormat: e.target.value as any } })}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-och-midnight border border-och-steel-grey/30 rounded-lg text-white disabled:opacity-50"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        </div>
      </section>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      )}
    </div>
  );
};

