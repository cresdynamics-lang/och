'use client';

import { EmailNotifications } from './EmailNotifications';
import { SMSNotifications } from './SMSNotifications';
import { PushNotifications } from './PushNotifications';
import { NotificationPriorities } from './NotificationPriorities';
import type { NotificationSettings as NotificationSettingsType } from '@/types/analyst-settings';

interface NotificationSettingsProps {
  userId: string;
  data: NotificationSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const NotificationSettings = ({ userId, data, onUpdate }: NotificationSettingsProps) => {
  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <section aria-labelledby="email-notifications-heading">
        <EmailNotifications
          email={data.channels.email}
          userId={userId}
          onUpdate={(updates) => onUpdate('notifications', {
            channels: { ...data.channels, email: { ...data.channels.email, ...updates } }
          })}
        />
      </section>

      {/* SMS Notifications */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="sms-notifications-heading">
        <SMSNotifications
          sms={data.channels.sms}
          userId={userId}
          onUpdate={(updates) => onUpdate('notifications', {
            channels: { ...data.channels, sms: { ...data.channels.sms, ...updates } }
          })}
        />
      </section>

      {/* Push Notifications */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="push-notifications-heading">
        <PushNotifications
          push={data.channels.push}
          userId={userId}
          onUpdate={(updates) => onUpdate('notifications', {
            channels: { ...data.channels, push: { ...data.channels.push, ...updates } }
          })}
        />
      </section>

      {/* In-App Notifications */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="inapp-notifications-heading">
        <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
          <div>
            <h4 id="inapp-notifications-heading" className="font-medium">In-App Notifications</h4>
            <div className="text-sm text-och-steel-grey mt-1">
              Always enabled for important updates
            </div>
          </div>
          <div className="text-sm text-och-cyber-mint">Always On</div>
        </div>
      </section>

      {/* Notification Priorities */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="priorities-heading">
        <NotificationPriorities
          priorities={data.priorities}
          userId={userId}
          onUpdate={(updates) => onUpdate('notifications', { priorities: updates })}
        />
      </section>
    </div>
  );
};

