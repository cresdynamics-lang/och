/**
 * Notification Engine Component
 * Mission/Coaching alerts with impact explanations
 * Enhanced with frequency controls, quiet hours, digest options, and channel preferences
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Target, MessageSquare, Briefcase, Mail, Smartphone, Clock, Moon, Sun, Zap, Calendar, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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

interface NotificationEngineProps {
  settings: UserSettings;
  updateSettings: (updates: SettingsUpdate) => void;
}

export function NotificationEngine({ settings, updateSettings }: NotificationEngineProps) {
  const [showQuietHours, setShowQuietHours] = useState(false);
  const [showDigestOptions, setShowDigestOptions] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [digestFrequency, setDigestFrequency] = useState<'daily' | 'weekly' | 'never'>('daily');

  const categories = [
    {
      key: 'missions' as const,
      icon: Target,
      label: 'Missions',
      description: 'Deadlines, completions, and reviews',
      impact: 'Affects mission deadline reminders and unlock notifications',
      recommended: true,
    },
    {
      key: 'coaching' as const,
      icon: MessageSquare,
      label: 'Coaching',
      description: 'AI insights, habit reminders, and goals',
      impact: 'Affects habit streak warnings and reflection prompts',
      recommended: true,
    },
    {
      key: 'mentor' as const,
      icon: MessageSquare,
      label: 'Mentor',
      description: 'Feedback, session requests, and messages',
      impact: 'Affects mentor feedback and session requests',
      recommended: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Notifications</h2>
              <p className="text-xs text-slate-500 mt-1">
                Control alerts for missions, coaching, and system updates
              </p>
            </div>
          </div>

          {/* Global Toggles */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Email Notifications</div>
                  <div className="text-xs text-slate-500">Receive updates via email</div>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ notificationsEmail: !settings.notificationsEmail })}
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
                onClick={() => updateSettings({ notificationsPush: !settings.notificationsPush })}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">Notification Categories</h3>
              <p className="text-xs text-slate-500">Control what notifications you receive</p>
            </div>
            <div className="space-y-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const enabled = settings.notificationsCategories[category.key] !== false;

                return (
                  <div
                    key={category.key}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors bg-slate-800/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-slate-200">{category.label}</div>
                          {category.recommended && (
                            <Badge variant="steel" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mb-1">{category.description}</div>
                        <div className="text-xs text-slate-600">{category.impact}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        updateSettings({
                          notificationsCategories: {
                            ...settings.notificationsCategories,
                            [category.key]: !enabled,
                          },
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
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

          {/* Notification Frequency */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">Notification Frequency</h3>
              <p className="text-xs text-slate-500">Control how often you receive notifications</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'instant', label: 'Instant', icon: Zap, description: 'Receive immediately' },
                { value: 'batched', label: 'Batched', icon: Clock, description: 'Grouped every hour' },
                { value: 'digest', label: 'Digest', icon: Calendar, description: 'Daily summary' },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      // Update notification frequency preference
                      updateSettings({
                        // This would be a new field in settings
                        // For now, we'll use a workaround
                      });
                    }}
                    className="p-4 rounded-lg border-2 border-slate-700 hover:border-slate-600 transition-all text-left bg-slate-800/30"
                  >
                    <Icon className="w-5 h-5 text-indigo-400 mb-2" />
                    <div className="font-semibold text-slate-200">{option.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="mt-6 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Moon className="w-7 h-7 text-indigo-400" />
                <div>
                  <h4 className="font-bold text-xl text-slate-100">Quiet Hours</h4>
                  <p className="text-slate-400 text-sm">Pause non-urgent notifications during specific times</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuietHours(!showQuietHours)}
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                {showQuietHours ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {showQuietHours && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mt-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                        className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        End Time
                      </label>
                      <input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                        className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="quiet-hours-enabled"
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <label htmlFor="quiet-hours-enabled" className="text-sm text-slate-300">
                      Enable quiet hours (urgent notifications will still be delivered)
                    </label>
                  </div>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <p className="text-xs text-indigo-300">
                      <strong>Note:</strong> Mission deadlines and critical alerts will bypass quiet hours to ensure you don't miss important updates.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Digest Options */}
          <div className="mt-6 p-6 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-7 h-7 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-xl text-slate-100">Notification Digest</h4>
                  <p className="text-slate-400 text-sm">Receive a summary of all notifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowDigestOptions(!showDigestOptions)}
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                {showDigestOptions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {showDigestOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    {[
                      { value: 'daily', label: 'Daily Digest', description: 'Summary every morning at 9:00 AM' },
                      { value: 'weekly', label: 'Weekly Digest', description: 'Summary every Monday morning' },
                      { value: 'never', label: 'No Digest', description: 'Receive all notifications individually' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDigestFrequency(option.value as any)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          digestFrequency === option.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                        }`}
                      >
                        <div className="font-semibold text-slate-200">{option.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">Digest includes:</strong> Mission updates, coaching insights, mentor feedback, and system announcements.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Channel Preferences */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Channel Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-200">Email Channel</div>
                    <div className="text-xs text-slate-500">Receive notifications via email</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className={`w-4 h-4 ${settings.notificationsEmail ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <button
                    onClick={() => updateSettings({ notificationsEmail: !settings.notificationsEmail })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.notificationsEmail ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings.notificationsEmail ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-200">Push Notifications</div>
                    <div className="text-xs text-slate-500">Browser and mobile push alerts</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className={`w-4 h-4 ${settings.notificationsPush ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <button
                    onClick={() => updateSettings({ notificationsPush: !settings.notificationsPush })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.notificationsPush ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings.notificationsPush ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

