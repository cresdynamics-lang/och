/**
 * Notification Control Panel Component
 * Drives retention through preferences
 */

'use client';

import { Bell, Mail, Smartphone, Target, MessageSquare, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Local types to replace missing @/lib/settings imports
export interface UserSettings {
  notificationsEmail: boolean;
  notificationsPush: boolean;
  notificationsCategories: Record<string, boolean>;
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface NotificationControlPanelProps {
  settings: UserSettings | null;
  onUpdate: (updates: SettingsUpdate) => void;
}

export function NotificationControlPanel({ settings, onUpdate }: NotificationControlPanelProps) {
  if (!settings) return null;

  const categories = [
    {
      key: 'missions' as const,
      icon: Target,
      label: 'Missions',
      description: 'Deadlines, completions, and reviews',
    },
    {
      key: 'coaching' as const,
      icon: MessageSquare,
      label: 'Coaching',
      description: 'AI insights, habit reminders, and goals',
    },
    {
      key: 'mentor' as const,
      icon: MessageSquare,
      label: 'Mentor',
      description: 'Feedback, session requests, and messages',
    },
  ];

  return (
    <Card className="glass-card glass-card-hover">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Notifications</h2>
            <p className="text-xs text-slate-500 mt-1">
              Stay updated on missions, coaching, and system updates
            </p>
          </div>
        </div>

        {/* Global Toggles */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-sm font-medium text-slate-200">Email Notifications</div>
                <div className="text-xs text-slate-500">Receive updates via email</div>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ notificationsEmail: !settings.notificationsEmail })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationsEmail ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationsEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-sm font-medium text-slate-200">Push Notifications</div>
                <div className="text-xs text-slate-500">Browser and mobile push alerts</div>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ notificationsPush: !settings.notificationsPush })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notificationsPush ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notificationsPush ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Category Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Notification Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const enabled = settings.notificationsCategories[category.key] !== false;

              return (
                <div
                  key={category.key}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-slate-200">{category.label}</div>
                  {(category.key === 'missions' || category.key === 'coaching') && (
                    <Badge variant="steel" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">{category.description}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {category.key === 'missions' && 'Affects mission deadline reminders and unlock notifications'}
                  {category.key === 'coaching' && 'Affects habit streak warnings and reflection prompts'}
                  {category.key === 'mentor' && 'Affects mentor feedback and session requests'}
                </div>
              </div>
                  </div>
                  <button
                    onClick={() => {
                      onUpdate({
                        notificationsCategories: {
                          ...settings.notificationsCategories,
                          [category.key]: !enabled,
                        },
                      });
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      enabled ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

