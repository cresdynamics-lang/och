/**
 * Settings Master Dashboard Component
 * Redesigned for OCH Mission Control
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Link2, 
  Command,
  Activity,
  Cpu,
  Lock,
  Globe
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProfileCompleteness } from './ProfileCompleteness';
import { ProfileFormSection } from './ProfileFormSection';
import { PrivacyMasterSwitch } from './PrivacyMasterSwitch';
import { SubscriptionControlPanel } from './SubscriptionControlPanel';
import { NotificationEngine } from './NotificationEngine';
import { IntegrationHub } from './IntegrationHub';
import { CoachingControlPanel } from './CoachingControlPanel';
import { SecurityControlPanel } from './SecurityControlPanel';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

type SettingsTab = 'profile' | 'subscription' | 'privacy' | 'notifications' | 'integrations' | 'security';

export function SettingsMasterDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Initialize from URL param if present
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const userId = user?.id?.toString();

  const {
    settings,
    entitlements,
    isLoading,
    isUpdating,
    error,
    updateSettings,
    refetch,
  } = useSettingsMaster(userId);

  // Sync state with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/student/settings?tab=${tab}`, { scroll: false });
  };

  const defaultSettings = {
    userId: userId || '',
    profileCompleteness: 0,
    avatarUploaded: false,
    linkedinLinked: false,
    bioCompleted: false,
    name: user?.first_name || '',
    headline: '',
    location: '',
    track: 'defender' as const,
    timezoneSet: 'Africa/Nairobi',
    languagePreference: 'en',
    portfolioVisibility: 'private' as const,
    dataSharingConsent: {},
    notificationsEmail: true,
    notificationsPush: true,
    notificationsCategories: {
      missions: true,
      coaching: true,
      mentor: false,
    },
    aiCoachStyle: 'motivational' as const,
    habitFrequency: 'daily' as const,
    reflectionPromptStyle: 'guided' as const,
    integrations: {},
    twoFactorEnabled: false,
    activeSessions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultEntitlements = {
    userId: userId || '',
    profileCompleteness: 0,
    tier: 'free' as const,
    subscriptionStatus: 'inactive' as const,
    aiCoachFullAccess: false,
    mentorAccess: false,
    portfolioExportEnabled: false,
    missionAccess: 'basic' as const,
    portfolioCapabilities: [],
  };

  const displaySettings = settings || defaultSettings;
  const displayEntitlements = entitlements || defaultEntitlements;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-och-steel animate-pulse font-black uppercase tracking-widest text-[10px]">Syncing Settings Telemetry...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as const, label: 'Identity & Persona', icon: User },
    { id: 'subscription' as const, label: 'Subscription Tier', icon: CreditCard },
    { id: 'privacy' as const, label: 'Data & Visibility', icon: Shield },
    { id: 'notifications' as const, label: 'Alert Protocols', icon: Bell },
    { id: 'integrations' as const, label: 'System Links', icon: Link2 },
    { id: 'security' as const, label: 'Security Core', icon: Lock },
  ];

  const systemStatuses = [
    { label: 'Integrity', value: `${displaySettings.profileCompleteness || 0}%`, status: (displaySettings.profileCompleteness || 0) >= 80 ? 'active' : 'warning', color: 'text-och-mint' },
    { label: 'Protocol', value: (displayEntitlements.tier || 'free').toUpperCase(), status: 'active', color: 'text-och-gold' },
    { label: 'Visibility', value: (displaySettings.portfolioVisibility || 'private').toUpperCase(), status: 'active', color: 'text-och-defender' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. SETTINGS TELEMETRY HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-gradient-to-br from-och-midnight via-och-midnight to-och-defender/5 p-8 rounded-[3rem] border border-och-steel/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-och-gold/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-och-gold/10 transition-all duration-1000" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
             <div className="absolute inset-0 bg-och-gold/5 animate-pulse" />
             <Command className="w-10 h-10 text-och-gold" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Configuration</h1>
              <Badge variant="gold" className="text-[10px] font-black tracking-[0.2em] px-2 h-5 text-black">ADMIN MODE</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-och-steel text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-och-mint animate-ping" />
                Node: {userId?.substring(0, 8) || 'GUEST-01'}
              </p>
              <div className="h-4 w-px bg-och-steel/20 hidden sm:block" />
              <p className="text-och-gold text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" />
                Platform: OCH HUB v4.2
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto relative z-10">
          {systemStatuses.map((stat, i) => (
            <div key={i} className="flex-1 min-w-[160px] p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
               <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
               <div className="flex items-baseline gap-1.5">
                 <span className={clsx("text-2xl font-black", stat.color)}>{stat.value}</span>
               </div>
               <div className="flex items-center gap-1.5 mt-2">
                 <div className={clsx("w-1.5 h-1.5 rounded-full", stat.status === 'active' ? 'bg-och-mint' : 'bg-och-orange')} />
                 <span className="text-[8px] text-och-steel font-bold uppercase">{stat.status.toUpperCase()}</span>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. CONFIGURATION NAVIGATION (Left Column) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={clsx(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] border relative group",
                  activeTab === tab.id
                    ? "bg-och-gold text-black border-och-gold shadow-lg shadow-och-gold/20 scale-[1.02]"
                    : "bg-white/5 text-och-steel border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-black" : "text-och-gold/60 group-hover:text-och-gold")} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="active-tab-indicator" className="absolute right-4 w-1.5 h-1.5 bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* HELP CENTER NUDGE */}
          <div className="p-6 rounded-[2.5rem] bg-och-midnight border border-och-steel/10 mt-8">
             <div className="flex items-center gap-2 mb-4">
               <Globe className="w-3.5 h-3.5 text-och-mint" />
               <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Support Core</span>
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed italic mb-4">
               "Need tactical assistance with your settings or subscription? Visit the Help Center."
             </p>
             <Button variant="outline" className="w-full h-10 rounded-xl border-och-steel/20 text-och-steel hover:text-white font-black uppercase tracking-widest text-[9px]">
                Support Docs
             </Button>
          </div>
        </aside>

        {/* 3. CONFIGURATION TERMINAL (Right Column) */}
        <main className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                      <User className="w-6 h-6 text-och-gold" />
                      Identity & Persona
                    </h2>
                    <Badge variant="mint" className="text-[9px] font-black uppercase">Sync Complete</Badge>
                  </div>
                  
                  <ProfileCompleteness 
                    settings={displaySettings} 
                    updateSettings={updateSettings} 
                    userId={userId} 
                  />
                  
                  <ProfileFormSection 
                    settings={displaySettings} 
                    updateSettings={updateSettings} 
                  />
                  
                  <CoachingControlPanel 
                    settings={displaySettings} 
                    onUpdate={updateSettings} 
                  />
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-och-gold" />
                    Subscription Tier
                  </h2>
                  <SubscriptionControlPanel entitlements={displayEntitlements as any} settings={displaySettings} />
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Shield className="w-6 h-6 text-och-gold" />
                    Data & Visibility
                  </h2>
                  <PrivacyMasterSwitch 
                    settings={displaySettings as any} 
                    entitlements={displayEntitlements as any} 
                    updateSettings={updateSettings} 
                    userId={userId} 
                  />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Bell className="w-6 h-6 text-och-gold" />
                    Alert Protocols
                  </h2>
                  <NotificationEngine settings={displaySettings as any} updateSettings={updateSettings} />
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Link2 className="w-6 h-6 text-och-gold" />
                    System Links
                  </h2>
                  <IntegrationHub settings={displaySettings} updateSettings={updateSettings} userId={userId} />
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Lock className="w-6 h-6 text-och-gold" />
                    Security Core
                  </h2>
                  <SecurityControlPanel settings={displaySettings} updateSettings={updateSettings} userId={userId} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
