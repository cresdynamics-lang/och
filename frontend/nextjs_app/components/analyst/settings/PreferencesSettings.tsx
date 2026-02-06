'use client';

import { DashboardPreferences } from './DashboardPreferences';
import { WorkflowPreferences } from './WorkflowPreferences';
import { LabPreferences } from './LabPreferences';
import { AccessibilityPreferences } from './AccessibilityPreferences';
import type { PreferencesSettings as PreferencesSettingsType } from '@/types/analyst-settings';

interface PreferencesSettingsProps {
  userId: string;
  data: PreferencesSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const PreferencesSettings = ({ userId, data, onUpdate }: PreferencesSettingsProps) => {
  return (
    <div className="space-y-6">
      {/* Dashboard Preferences */}
      <section aria-labelledby="dashboard-prefs-heading">
        <DashboardPreferences
          dashboard={data.dashboard}
          userId={userId}
          onUpdate={(updates) => onUpdate('preferences', {
            dashboard: { ...data.dashboard, ...updates }
          })}
        />
      </section>

      {/* Workflow Preferences */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="workflow-prefs-heading">
        <WorkflowPreferences
          workflow={data.workflow}
          userId={userId}
          onUpdate={(updates) => onUpdate('preferences', {
            workflow: { ...data.workflow, ...updates }
          })}
        />
      </section>

      {/* Lab Preferences */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="lab-prefs-heading">
        <LabPreferences
          lab={data.lab}
          userId={userId}
          onUpdate={(updates) => onUpdate('preferences', {
            lab: { ...data.lab, ...updates }
          })}
        />
      </section>

      {/* Accessibility Preferences */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="accessibility-prefs-heading">
        <AccessibilityPreferences
          accessibility={data.accessibility}
          userId={userId}
          onUpdate={(updates) => onUpdate('preferences', {
            accessibility: { ...data.accessibility, ...updates }
          })}
        />
      </section>

      {/* Notification Sound */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="sound-prefs-heading">
        <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
          <div>
            <h4 id="sound-prefs-heading" className="font-medium">Notification Sound</h4>
            <div className="text-sm text-och-steel-grey mt-1">
              Sound effects for notifications
            </div>
          </div>
          <select
            value={data.notifications.sound}
            onChange={(e) => onUpdate('preferences', {
              notifications: { sound: e.target.value }
            })}
            className="px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
          >
            <option value="default">Default</option>
            <option value="none">None</option>
          </select>
        </div>
      </section>
    </div>
  );
};

