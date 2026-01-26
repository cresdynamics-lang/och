/**
 * Privacy Control Panel Component
 * Data flow master switch
 */

'use client';

import { Shield, Lock, Eye, Mail, Globe } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Local types to replace missing @/lib/settings imports
export interface UserSettings {
  portfolioVisibility: 'private' | 'unlisted' | 'public';
  profileCompleteness: number;
  dataSharingConsent: Record<string, boolean>;
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface PrivacyControlPanelProps {
  settings: UserSettings | null;
  onUpdate: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function PrivacyControlPanel({ settings, onUpdate, userId }: PrivacyControlPanelProps) {
  if (!settings) return null;

  const visibilityOptions = [
    {
      value: 'private' as const,
      icon: Lock,
      label: 'Private',
      description: 'Only you can see',
      color: 'slate',
    },
    {
      value: 'unlisted' as const,
      icon: Eye,
      label: 'Unlisted',
      description: 'Shareable link',
      color: 'blue',
    },
    {
      value: 'public' as const,
      icon: Globe,
      label: 'Public',
      description: 'Everyone worldwide',
      color: 'emerald',
    },
  ];

  return (
    <Card className="glass-card glass-card-hover">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Privacy & Visibility</h2>
            <p className="text-xs text-slate-500 mt-1">
              Control who can see your portfolio and how your data is shared
            </p>
          </div>
        </div>

        {/* Portfolio Visibility */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block">
            Portfolio Visibility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = settings.portfolioVisibility === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onUpdate({ portfolioVisibility: option.value });
                    
                    // Sync portfolio items visibility in realtime (TODO: Implement Django endpoint)
                    if (userId) {
                      console.log('Syncing portfolio visibility for user', userId, 'to', option.value);
                    }
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-500/10`
                      : 'border-slate-700 hover:border-slate-600'
                  } cursor-pointer`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 text-${isSelected ? option.color : 'slate'}-400`} />
                    <span className={`font-semibold ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <Badge variant="outline" className="ml-auto">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Sharing Consent */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-slate-100">Data Sharing</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dataSharingConsent.talentscope || false}
                onChange={(e) => {
                  onUpdate({
                    dataSharingConsent: {
                      ...settings.dataSharingConsent,
                      talentscope: e.target.checked,
                    },
                  });
                }}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-200">TalentScope Integration</div>
                <div className="text-xs text-slate-500">Share readiness scores and portfolio data</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
}

