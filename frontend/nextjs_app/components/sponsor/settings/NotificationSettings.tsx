'use client';

import { Switch } from '@/components/ui/Switch';
import { Bell, Mail, Smartphone } from 'lucide-react';
import type { NotificationSettings as NotificationSettingsType } from '@/types/sponsor-settings';

interface NotificationSettingsProps {
  userId: string;
  data: NotificationSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const NotificationSettings = ({ userId, data, onUpdate }: NotificationSettingsProps) => {
  const handleToggle = async (path: string, value: boolean) => {
    try {
      const [category, key] = path.split('.');
      await onUpdate('notifications', {
        [category]: { ...data[category as keyof NotificationSettingsType], [key]: value }
      });
    } catch (error) {
      alert('Failed to update notification settings');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Notifications</h2>
        <p className="text-och-steel-grey text-sm">
          Configure how you receive notifications and updates
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-och-defender-blue" />
          Email Notifications
        </h3>
        <div className="space-y-4 p-4 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Email Notifications</div>
              <div className="text-sm text-och-steel-grey">Receive notifications via email</div>
            </div>
            <Switch
              checked={data.email.enabled}
              onCheckedChange={(checked) => handleToggle('email.enabled', checked)}
            />
          </div>
          {data.email.enabled && (
            <div className="space-y-3 pt-3 border-t border-och-steel-grey/20">
              {Object.entries(data.email.categories).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => handleToggle(`email.categories.${key}`, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-och-defender-blue" />
          SMS Notifications
        </h3>
        <div className="p-4 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">SMS Notifications</div>
              <div className="text-sm text-och-steel-grey">Receive urgent notifications via SMS</div>
            </div>
            <Switch
              checked={data.sms.enabled}
              onCheckedChange={(checked) => handleToggle('sms.enabled', checked)}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-och-steel-grey/30 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-och-defender-blue" />
          In-App Notifications
        </h3>
        <div className="p-4 bg-och-steel-grey/10 rounded-lg border border-och-steel-grey/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">In-App Notifications</div>
              <div className="text-sm text-och-steel-grey">Show notifications in the dashboard</div>
            </div>
            <Switch
              checked={data.inApp.enabled}
              onCheckedChange={(checked) => handleToggle('inApp.enabled', checked)}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

