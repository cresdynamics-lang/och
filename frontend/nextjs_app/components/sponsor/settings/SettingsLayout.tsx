'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  User, 
  Bell, 
  Lock, 
  CreditCard, 
  Settings as SettingsIcon,
  Building2,
  Users,
  Search,
  ChevronDown
} from 'lucide-react';
import { AccountSettings } from './AccountSettings';
import { OrganizationSettings } from './OrganizationSettings';
import { BillingSettings } from './BillingSettings';
import { TeamSettings } from './TeamSettings';
import { PrivacySettings } from './PrivacySettings';
import { NotificationSettings } from './NotificationSettings';
import { PreferencesSettings } from './PreferencesSettings';
import { DashboardErrorBoundary } from '@/components/analyst/ErrorBoundary';
import type { SponsorSettings } from '@/types/sponsor-settings';

interface SettingsLayoutProps {
  userId: string;
  settings: SponsorSettings;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

const tabs = [
  { id: 'account', label: 'Account', icon: User, section: 'account' },
  { id: 'organization', label: 'Organization', icon: Building2, section: 'organization' },
  { id: 'billing', label: 'Billing & Subscription', icon: CreditCard, section: 'billing' },
  { id: 'team', label: 'Team Management', icon: Users, section: 'team' },
  { id: 'privacy', label: 'Privacy & Consent', icon: Lock, section: 'privacy' },
  { id: 'notifications', label: 'Notifications', icon: Bell, section: 'notifications' },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon, section: 'preferences' },
];

export const SettingsLayout = ({
  userId,
  settings,
  activeTab,
  onTabChange,
  onUpdate,
}: SettingsLayoutProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTabs = tabs.filter(tab =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];
  const ActiveComponent = {
    account: AccountSettings,
    organization: OrganizationSettings,
    billing: BillingSettings,
    team: TeamSettings,
    privacy: PrivacySettings,
    notifications: NotificationSettings,
    preferences: PreferencesSettings,
  }[activeTabData.section as keyof typeof ActiveComponent] || AccountSettings;

  return (
    <div className="min-h-screen bg-och-midnight-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Sponsor Settings</h1>
          <p className="text-och-steel">
            Manage your organization account, billing, team, and preferences
          </p>
        </div>

        {/* Search (Mobile) */}
        <div className="lg:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-och-steel" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-och-steel/20 border border-och-steel/30 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-och-midnight border border-och-steel/30 rounded-lg p-4 sticky top-24">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-och-steel" />
                  <input
                    type="text"
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-och-steel/20 border border-och-steel/30 rounded-lg text-white placeholder-och-steel focus:outline-none focus:ring-2 focus:ring-och-defender"
                  />
                </div>
              </div>

              <nav className="space-y-1" role="tablist" aria-label="Settings navigation">
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        isActive
                          ? 'bg-och-defender/20 text-och-defender border border-och-defender/30'
                          : 'text-och-steel hover:bg-och-steel/20 hover:text-white'
                      )}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.id}`}
                      id={`tab-${tab.id}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Accordion */}
          <div className="lg:hidden space-y-4">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isExpanded = activeTab === tab.id;
              return (
                <div key={tab.id} className="border border-och-steel/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onTabChange(isExpanded ? '' : tab.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-och-steel/20 text-left"
                    aria-expanded={isExpanded}
                    aria-controls={`mobile-section-${tab.id}`}
                    id={`tab-${tab.id}`}
                    role="tab"
                  >
                    <span className="flex items-center gap-3 font-medium text-white">
                      <Icon className="w-5 h-5 text-och-defender" />
                      {tab.label}
                    </span>
                    <ChevronDown className={cn(
                      'w-5 h-5 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </button>
                  {isExpanded && (
                    <div
                      id={`mobile-section-${tab.id}`}
                      className="border-t border-och-steel/30 bg-och-midnight-black"
                      role="tabpanel"
                      aria-labelledby={`tab-${tab.id}`}
                    >
                      <div className="p-4">
                        <DashboardErrorBoundary>
                          <ActiveComponent
                            userId={userId}
                            data={settings[tab.section as keyof SponsorSettings] as any}
                            onUpdate={onUpdate}
                          />
                        </DashboardErrorBoundary>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-och-midnight border border-och-steel/30 rounded-lg p-6 min-h-[400px]">
              <DashboardErrorBoundary>
                {settings && settings[activeTabData.section as keyof SponsorSettings] ? (
                  <ActiveComponent
                    userId={userId}
                    data={settings[activeTabData.section as keyof SponsorSettings] as any}
                    onUpdate={onUpdate}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-och-steel-grey">Loading settings...</p>
                  </div>
                )}
              </DashboardErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

