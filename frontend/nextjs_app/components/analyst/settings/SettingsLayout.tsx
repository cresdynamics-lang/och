'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  User, 
  Bell, 
  Lock, 
  CreditCard, 
  Settings as SettingsIcon,
  FileText,
  ChevronRight,
  Search,
  ChevronDown
} from 'lucide-react';
import { AccountSettings } from './AccountSettings';
import { ProfileSettings } from './ProfileSettings';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';
import { SubscriptionSettings } from './SubscriptionSettings';
import { PreferencesSettings } from './PreferencesSettings';
import { DashboardErrorBoundary } from '@/components/analyst/ErrorBoundary';
import type { AnalystSettings } from '@/types/analyst-settings';

interface SettingsLayoutProps {
  userId: string;
  settings: AnalystSettings;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

const tabs = [
  { id: 'account', label: 'Account', icon: User, section: 'account' },
  { id: 'profile', label: 'Profile', icon: FileText, section: 'profile' },
  { id: 'notifications', label: 'Notifications', icon: Bell, section: 'notifications' },
  { id: 'privacy', label: 'Privacy & Sharing', icon: Lock, section: 'privacy' },
  { id: 'subscription', label: 'Subscription', icon: CreditCard, section: 'subscription' },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([activeTab]));

  const filteredTabs = tabs.filter(tab =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTabData = tabs.find(t => t.id === activeTab);
  const ActiveComponent = {
    account: AccountSettings,
    profile: ProfileSettings,
    notifications: NotificationSettings,
    privacy: PrivacySettings,
    subscription: SubscriptionSettings,
    preferences: PreferencesSettings,
  }[activeTab] || AccountSettings;

  const toggleMobileSection = (tabId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(tabId)) {
      newExpanded.delete(tabId);
    } else {
      newExpanded.add(tabId);
      onTabChange(tabId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="min-h-screen bg-och-midnight-black text-white">
      {/* Header */}
      <header className="border-b border-och-steel-grey/30 bg-och-midnight-black/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-och-defender-blue">Settings</h1>
              <p className="text-sm text-och-steel-grey mt-1">Manage your account and preferences</p>
            </div>
            
            {/* Search (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-och-steel-grey" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-och-steel-grey/20 border border-och-steel-grey/30 rounded-lg text-white placeholder-och-steel-grey focus:outline-none focus:ring-2 focus:ring-och-defender-blue w-64"
                  aria-label="Search settings"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1" role="navigation" aria-label="Settings navigation">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left',
                      isActive
                        ? 'bg-och-defender-blue/20 border border-och-defender-blue/50 text-och-defender-blue'
                        : 'text-och-steel-grey hover:bg-och-steel-grey/10 hover:text-white border border-transparent'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    role="tab"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Accordion Navigation */}
          <div className="lg:hidden mb-4 space-y-2">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-och-steel-grey" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-och-steel-grey/20 border border-och-steel-grey/30 rounded-lg text-white placeholder-och-steel-grey focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
                aria-label="Search settings"
              />
            </div>

            {/* Accordion Sections */}
            <div className="space-y-2" role="tablist" aria-label="Settings sections">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isExpanded = expandedSections.has(tab.id);
                
                return (
                  <div
                    key={tab.id}
                    className="border border-och-steel-grey/30 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleMobileSection(tab.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 transition-all',
                        isActive
                          ? 'bg-och-defender-blue/20 text-och-defender-blue'
                          : 'bg-och-steel-grey/10 text-och-steel-grey hover:bg-och-steel-grey/20'
                      )}
                      aria-expanded={isExpanded}
                      aria-controls={`mobile-section-${tab.id}`}
                      role="tab"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                      <ChevronDown className={cn(
                        'w-5 h-5 transition-transform',
                        isExpanded && 'rotate-180'
                      )} />
                    </button>
                    
                    {isExpanded && (
                      <div
                        id={`mobile-section-${tab.id}`}
                        className="border-t border-och-steel-grey/30 bg-och-midnight-black"
                        role="tabpanel"
                        aria-labelledby={`tab-${tab.id}`}
                      >
                        <div className="p-4">
                          <DashboardErrorBoundary>
                            {(() => {
                              const Component = {
                                account: AccountSettings,
                                profile: ProfileSettings,
                                notifications: NotificationSettings,
                                privacy: PrivacySettings,
                                subscription: SubscriptionSettings,
                                preferences: PreferencesSettings,
                              }[tab.id] || AccountSettings;
                              return (
                                <Component
                                  userId={userId}
                                  data={settings[tab.section as keyof AnalystSettings] as any}
                                  onUpdate={onUpdate}
                                />
                              );
                            })()}
                          </DashboardErrorBoundary>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1" role="main" aria-label={`${activeTabData?.label} settings`}>
            <div className="bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {activeTabData && <activeTabData.icon className="w-6 h-6 text-och-defender-blue" />}
                  {activeTabData?.label}
                </h2>
                <p className="text-sm text-och-steel-grey mt-1">
                  Manage your {activeTabData?.label.toLowerCase()} settings
                </p>
              </div>

              <DashboardErrorBoundary>
                <ActiveComponent
                  userId={userId}
                  data={settings[activeTabData?.section as keyof AnalystSettings] as any}
                  onUpdate={onUpdate}
                />
              </DashboardErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

