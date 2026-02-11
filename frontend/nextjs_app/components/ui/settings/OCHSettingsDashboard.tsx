/**
 * OCH Settings Dashboard - Comprehensive Account Management
 * 
 * Implements all OCH guidelines for student account management:
 * 1. Initial Setup and Onboarding
 * 2. Profile Management and Identity
 * 3. Subscription and Access Control
 * 4. Privacy, Security, and Consent
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, CreditCard, Lock, Building2, GraduationCap,
  CheckCircle2, XCircle, AlertCircle, Mail, Clock, Globe,
  Download, Trash2, Eye, EyeOff, Settings, LogOut, Key,
  Calendar, DollarSign, Zap, Target, FileText, Database,
  Users, Briefcase, Award, Activity, RefreshCw, ExternalLink, Monitor
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { djangoClient } from '@/services/djangoClient';
import { apiGateway } from '@/services/apiGateway';
import { subscriptionClient } from '@/services/subscriptionClient';
import { profilerClient } from '@/services/profilerClient';
import type { ConsentUpdate } from '@/services/types/user';
import clsx from 'clsx';

type SettingsSection = 'overview' | 'onboarding' | 'profile' | 'subscription' | 'privacy' | 'security';

interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country?: string;
  timezone?: string;
  bio?: string;
  preferred_learning_style?: string;
  career_goals?: string;
  university_id?: number;
  university_name?: string;
  is_active?: boolean;
  role_specific_data?: {
    student?: {
      track_name?: string;
      cohort_name?: string;
      enrollment_status?: string;
      profiler_completed?: boolean;
      future_you_persona?: string;
      university_id?: number;
      university_name?: string;
    };
  };
  consent_scopes?: string[];
  mfa_enabled?: boolean;
  email_verified?: boolean;
}

interface UniversityOption {
  id: number;
  name: string;
  short_name?: string;
  code?: string;
  slug?: string;
}

interface SubscriptionData {
  tier: 'free' | 'starter' | 'professional';
  status: 'active' | 'inactive' | 'past_due' | 'cancelled';
  enhanced_access_until?: string;
  days_enhanced_left?: number;
  next_payment?: string;
  grace_period_until?: string;
  can_upgrade: boolean;
  features: string[];
}

interface ProfilerStatus {
  completed: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  sections_completed: string[];
  future_you_completed: boolean;
}

interface UniversityInfo {
  id: number;
  name: string;
  code: string;
  auto_mapped: boolean;
}

interface ActiveSession {
  id: string;
  device_info?: string;
  location?: string;
  last_active: string;
  current: boolean;
}

export function OCHSettingsDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, reloadUser } = useAuth();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (searchParams.get('section') as SettingsSection) || 'overview'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [profilerStatus, setProfilerStatus] = useState<ProfilerStatus | null>(null);
  const [university, setUniversity] = useState<UniversityInfo | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [consentScopes, setConsentScopes] = useState<Record<string, boolean>>({});
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  
  // UI states
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [user?.id]);

  // Sync active section from URL (e.g. when navigating with section= query)
  useEffect(() => {
    const section = searchParams.get('section') as SettingsSection | null;
    if (section && ['overview', 'onboarding', 'profile', 'subscription', 'privacy', 'security'].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const loadAllData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadProfile(),
        loadSubscription(),
        loadProfilerStatus(),
        loadUniversity(),
        loadUniversitiesList(),
        loadActiveSessions(),
        loadConsentScopes(),
      ]);
    } catch (err: any) {
      console.error('Failed to load settings data:', err);
      setError(err?.message || 'Failed to load settings. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await apiGateway.get('/auth/me');
      setProfile(data as any);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadSubscription = async () => {
    try {
      const data = await apiGateway.get<any>('/subscription/status');
      setSubscription({
        tier: (data as any).tier || 'free',
        status: (data as any).status || 'inactive',
        enhanced_access_until: (data as any).enhanced_access_until,
        days_enhanced_left: (data as any).days_enhanced_left,
        next_payment: (data as any).next_payment,
        grace_period_until: (data as any).grace_period_until,
        can_upgrade: (data as any).can_upgrade !== false,
        features: (data as any).features || [],
      });
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setSubscription({
        tier: 'free',
        status: 'inactive',
        can_upgrade: true,
        features: [],
      });
    }
  };

  const loadProfilerStatus = async () => {
    try {
      const data = await profilerClient.getStatus(user?.id?.toString());
      setProfilerStatus({
        completed: (data as any).completed || false,
        status: (data as any).status || 'not_started',
        sections_completed: (data as any).sections_completed || [],
        future_you_completed: (data as any).future_you_completed || false,
      });
    } catch (err) {
      console.error('Failed to load profiler status:', err);
    }
  };

  const loadUniversity = async () => {
    try {
      const raw = await apiGateway.get<any>('/community/memberships/');
      const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
      if (list.length > 0) {
        const membership = list[0];
        setUniversity({
          id: membership.university?.id,
          name: membership.university?.name,
          code: membership.university?.code,
          auto_mapped: membership.auto_mapped || false,
        });
      }
    } catch (err) {
      console.error('Failed to load university:', err);
    }
  };

  const loadUniversitiesList = async () => {
    try {
      const raw = await apiGateway.get<any>('/community/universities/', { params: { page_size: 100 } });
      const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
      setUniversities(list.map((u: any) => ({ id: u.id, name: u.name, short_name: u.short_name, code: u.code, slug: u.slug })));
    } catch (err) {
      console.error('Failed to load universities list:', err);
    }
  };

  const loadActiveSessions = async () => {
    try {
      // Note: This endpoint needs to be implemented in backend
      const sessions = await apiGateway.get<any>('/auth/sessions/').catch(() => []);
      setActiveSessions((sessions as any) || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadConsentScopes = async () => {
    try {
      const data = await apiGateway.get<any>('/auth/me');
      const scopes: Record<string, boolean> = {};
      if ((data as any).consent_scopes) {
        (data as any).consent_scopes.forEach((scope: string) => {
          scopes[scope] = true;
        });
      }
      setConsentScopes(scopes);
    } catch (err) {
      console.error('Failed to load consent scopes:', err);
    }
  };

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    // Use current pathname so sponsor/admin stay in their dashboard (e.g. /dashboard/sponsor/settings)
    const base = pathname?.replace(/\?.*$/, '') ?? '/dashboard/student/settings';
    router.push(`${base}?section=${section}`, { scroll: false });
  };

  const handleProfileUpdate = async (updates: Partial<ProfileData>) => {
    if (!profile) return;
    
    setSaving(true);
    setSaveStatus(null);
    
    try {
      await djangoClient.users.updateProfile(updates as any);
      await loadProfile();
      await reloadUser();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleConsentUpdate = async (scopeType: string, granted: boolean) => {
    try {
      const update: ConsentUpdate = {
        scope_type: scopeType,
        granted,
      };
      await djangoClient.auth.updateConsent(update);
      await loadConsentScopes();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error updating consent:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to update consent.');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiGateway.delete(`/auth/sessions/${sessionId}/`);
      await loadActiveSessions();
      setSaveStatus('success');
    } catch (err: any) {
      console.error('Error revoking session:', err);
      setSaveStatus('error');
    }
  };

  const handleRequestDataExport = async (format: 'json' | 'csv') => {
    try {
      setSaving(true);
      // Request SAR (Subject Access Request) for data export
      const response = await apiGateway.post<any>('/auth/data-export/', { format });
      // In production, this would trigger an async job and notify user when ready
      alert(`Data export requested. You will be notified when it's ready. Export ID: ${(response as any).id}`);
      setShowExportModal(false);
    } catch (err: any) {
      console.error('Error requesting data export:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to request data export.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDataDeletion = async () => {
    try {
      setSaving(true);
      // Request right to be forgotten
      const response = await apiGateway.post('/auth/data-erasure/', {
        erasure_type: 'full',
        reason: 'User requested account deletion',
      });
      alert('Account deletion requested. This process may take up to 30 days. You will receive a confirmation email.');
      setShowDeleteModal(false);
      // Optionally log out user
      setTimeout(() => {
        router.push('/auth/logout');
      }, 5000);
    } catch (err: any) {
      console.error('Error requesting data deletion:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to request account deletion.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-och-mint border-t-transparent rounded-full animate-spin" />
          <p className="text-och-steel font-semibold">Loading your account settings...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'onboarding' as const, label: 'Onboarding', icon: Target },
    { id: 'profile' as const, label: 'Profile & Identity', icon: User },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
    { id: 'privacy' as const, label: 'Privacy & Consent', icon: Shield },
    { id: 'security' as const, label: 'Security', icon: Lock },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center">
            <Settings className="w-7 h-7 text-och-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Account Management</h1>
            <p className="text-och-steel">
              Manage your digital pilot's logbook and passport in the OCH ecosystem
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${
              saveStatus === 'success'
                ? 'bg-och-mint/10 border border-och-mint/30 text-och-mint'
                : 'bg-och-orange/10 border border-och-orange/30 text-och-orange'
            }`}
          >
            {saveStatus === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              {saveStatus === 'success' ? 'Settings saved successfully' : error || 'Failed to save settings'}
            </span>
          </motion.div>
        )}

        {error && !saveStatus && (
          <div className="p-4 rounded-lg mb-4 bg-och-orange/10 border border-och-orange/30 text-och-orange flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => setError(null)} className="ml-auto">
              Dismiss
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3">
          <Card className="p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-och-mint/10 border border-och-mint/30 text-och-mint'
                        : 'text-och-steel hover:bg-och-midnight/50 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-och-mint" />
                    )}
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'overview' && (
                <OverviewSection
                  profile={profile}
                  subscription={subscription}
                  profilerStatus={profilerStatus}
                  university={university}
                />
              )}
              
              {activeSection === 'onboarding' && (
                <OnboardingSection
                  profile={profile}
                  profilerStatus={profilerStatus}
                  university={university}
                  universities={universities}
                  onUpdateUniversity={loadUniversity}
                  onProfileUpdate={handleProfileUpdate}
                  settingsBase={pathname?.replace(/\?.*$/, '') ?? '/dashboard/student/settings'}
                  onNavigateSection={handleSectionChange}
                  onStartProfiler={() => router.push('/dashboard/student/profiling')}
                />
              )}
              
              {activeSection === 'profile' && (
                <ProfileSection
                  profile={profile}
                  onUpdate={handleProfileUpdate}
                  saving={saving}
                />
              )}
              
              {activeSection === 'subscription' && (
                <SubscriptionSection
                  subscription={subscription}
                  pathname={pathname}
                  onUpgrade={() => (pathname?.includes('/student/') ? router.push('/dashboard/student/subscription') : router.push(pathname?.replace(/\/settings.*$/, '') || '/dashboard/sponsor'))}
                  onReload={loadSubscription}
                />
              )}
              
              {activeSection === 'privacy' && (
                <PrivacySection
                  consentScopes={consentScopes}
                  onConsentUpdate={handleConsentUpdate}
                  profile={profile}
                  onExportRequest={() => setShowExportModal(true)}
                  onDeleteRequest={() => setShowDeleteModal(true)}
                />
              )}
              
              {activeSection === 'security' && (
                <SecuritySection
                  profile={profile}
                  activeSessions={activeSessions}
                  onMFAEnable={() => router.push(`${pathname?.replace(/\?.*$/, '') ?? '/dashboard/student/settings'}?section=security&mfa=true`)}
                  onRevokeSession={handleRevokeSession}
                  onProfileUpdate={handleProfileUpdate}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Data Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleRequestDataExport}
          saving={saving}
        />
      )}

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleRequestDataDeletion}
          saving={saving}
        />
      )}
    </div>
  );
}

// Overview Section Component
function OverviewSection({ profile, subscription, profilerStatus, university }: {
  profile: ProfileData | null;
  subscription: SubscriptionData | null;
  profilerStatus: ProfilerStatus | null;
  university: UniversityInfo | null;
}) {
  const profileCompleteness = calculateProfileCompleteness(profile, profilerStatus, university);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Account Overview</h2>
        <p className="text-och-steel">Your digital pilot's logbook status and readiness metrics</p>
      </div>

      {/* Profile Completeness */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Profile Completeness</h3>
          <Badge variant={profileCompleteness >= 80 ? 'mint' : profileCompleteness >= 50 ? 'orange' : 'steel'}>
            {profileCompleteness}%
          </Badge>
        </div>
        <div className="w-full bg-och-midnight rounded-full h-3 mb-4">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-och-mint to-och-gold transition-all duration-500"
            style={{ width: `${profileCompleteness}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-och-steel mb-1">Profile</div>
            <div className="text-white font-medium">
              {profile?.first_name && profile?.last_name ? 'Complete' : 'Incomplete'}
            </div>
          </div>
          <div>
            <div className="text-och-steel mb-1">Profiler</div>
            <div className="text-white font-medium">
              {profilerStatus?.completed ? 'Complete' : 'Pending'}
            </div>
          </div>
          <div>
            <div className="text-och-steel mb-1">University</div>
            <div className="text-white font-medium">
              {university ? university.name : 'Not Set'}
            </div>
          </div>
          <div>
            <div className="text-och-steel mb-1">Timezone</div>
            <div className="text-white font-medium">
              {profile?.timezone || 'Not Set'}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-och-gold" />
            <h3 className="font-semibold text-white">Subscription</h3>
          </div>
          <div className="text-2xl font-bold text-och-mint mb-1">
            {subscription?.tier ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1) : 'Free'}
          </div>
          <div className="text-sm text-och-steel">
            {subscription?.status === 'active' ? 'Active' : 'Inactive'}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-och-defender" />
            <h3 className="font-semibold text-white">TalentScope</h3>
          </div>
          <div className="text-2xl font-bold text-och-mint mb-1">
            {profilerStatus?.completed ? 'Baseline Set' : 'Not Started'}
          </div>
          <div className="text-sm text-och-steel">
            Day Zero Metrics: {profilerStatus?.completed ? 'Complete' : 'Pending'}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-och-orange" />
            <h3 className="font-semibold text-white">Security</h3>
          </div>
          <div className="text-2xl font-bold text-och-mint mb-1">
            {profile?.mfa_enabled ? 'MFA Enabled' : 'Basic'}
          </div>
          <div className="text-sm text-och-steel">
            {profile?.email_verified ? 'Email Verified' : 'Email Unverified'}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Calculate profile completeness percentage
function calculateProfileCompleteness(
  profile: ProfileData | null,
  profilerStatus: ProfilerStatus | null,
  university: UniversityInfo | null
): number {
  let score = 0;
  const checks = [
    { condition: profile?.first_name && profile?.last_name, weight: 20 },
    { condition: profile?.email_verified, weight: 10 },
    { condition: profile?.country, weight: 10 },
    { condition: profile?.timezone, weight: 10 },
    { condition: profilerStatus?.completed, weight: 30 },
    { condition: university !== null, weight: 20 },
  ];

  checks.forEach(({ condition, weight }) => {
    if (condition) score += weight;
  });

  return score;
}

// Onboarding Section
function OnboardingSection({
  profile,
  profilerStatus,
  university,
  universities,
  onUpdateUniversity,
  onProfileUpdate,
  settingsBase,
  onNavigateSection,
  onStartProfiler,
}: {
  profile: ProfileData | null;
  profilerStatus: ProfilerStatus | null;
  university: UniversityInfo | null;
  universities: UniversityOption[];
  onUpdateUniversity: () => void;
  onProfileUpdate: (u: Partial<ProfileData>) => Promise<void>;
  settingsBase: string;
  onNavigateSection: (s: SettingsSection) => void;
  onStartProfiler: () => void;
}) {
  const [showUniversitySearch, setShowUniversitySearch] = useState(false);
  const [universitySearch, setUniversitySearch] = useState('');
  const isStudent = settingsBase.includes('/student/');

  const checklist = [
    {
      id: 'identity_verification',
      label: 'Identity Verification',
      description: 'Register and verify your account via Email, Google SSO, or Apple ID',
      completed: !!(profile?.email_verified && (profile?.is_active !== false)),
      required: true,
    },
    ...(isStudent
      ? [
          {
            id: 'tier0_profiler',
            label: 'Tier 0 Profiler',
            description: 'Complete aptitude and technical reasoning assessment',
            completed: !!(profile?.role_specific_data?.student?.profiler_completed || profilerStatus?.completed),
            required: true,
            action: () => onStartProfiler(),
          },
        ]
      : []),
    {
      id: 'profile_completion',
      label: 'Profile Completion',
      description: 'Complete core metadata: name, country, timezone',
      completed: !!(profile?.first_name && profile?.last_name && profile?.country && profile?.timezone),
      required: false,
      action: () => onNavigateSection('profile'),
    },
    {
      id: 'university_mapping',
      label: 'University Mapping',
      description: 'Connect to your university community',
      completed: !!(profile?.university_id || profile?.university_name || university),
      required: false,
    },
    {
      id: 'mfa_setup',
      label: 'MFA Security (Recommended)',
      description: 'Enable Multi-Factor Authentication to protect your data',
      completed: !!profile?.mfa_enabled,
      required: false,
      action: () => onNavigateSection('security'),
    },
  ];

  const progress = checklist.length ? Math.round((checklist.filter((i: any) => i.completed).length / checklist.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Initial Setup & Onboarding</h2>
        <p className="text-och-steel">Complete your account setup to unlock full OCH features</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Onboarding Progress</h3>
          <Badge variant={progress >= 80 ? 'mint' : progress >= 50 ? 'orange' : 'steel'}>{progress}%</Badge>
        </div>
        <div className="w-full bg-och-midnight rounded-full h-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-och-mint to-och-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Checklist</h3>
        <div className="space-y-3">
          {checklist.map((item: any) => (
            <div
              key={item.id}
              className={clsx(
                'flex items-start gap-4 p-4 rounded-xl border transition-all',
                item.completed ? 'bg-green-500/5 border-green-500/20' : item.required ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/5'
              )}
            >
              {item.completed ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', item.required ? 'text-orange-400' : 'text-och-steel')} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">{item.label}</h4>
                  {item.required && <Badge variant="orange" className="text-[9px] font-black uppercase">Required</Badge>}
                </div>
                <p className="text-xs text-och-steel">{item.description}</p>
              </div>
              {!item.completed && item.action && (
                <Button variant="outline" size="sm" onClick={item.action}>
                  Complete
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="w-6 h-6 text-och-mint" />
          <div>
            <h3 className="text-lg font-semibold text-white">University Mapping</h3>
            <p className="text-xs text-och-steel">Join your local university community</p>
          </div>
        </div>
        {profile?.university_name || university?.name ? (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center justify-between">
            <p className="text-sm font-bold text-white">{profile?.university_name || university?.name}</p>
            <Button variant="outline" size="sm" onClick={() => onProfileUpdate({ university_id: undefined, university_name: undefined }).then(onUpdateUniversity)}>
              Change
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-och-steel mb-4">
              The system may auto-map you from your email domain. If not, select your institution below.
            </p>
            <Button variant="defender" size="sm" onClick={() => setShowUniversitySearch(!showUniversitySearch)}>
              {showUniversitySearch ? 'Cancel' : 'Select University'}
            </Button>
            {showUniversitySearch && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={universitySearch}
                  onChange={(e) => setUniversitySearch(e.target.value)}
                  placeholder="Search universities..."
                  className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none"
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {universities
                    .filter((u) => !universitySearch || u.name.toLowerCase().includes(universitySearch.toLowerCase()) || (u.short_name?.toLowerCase().includes(universitySearch.toLowerCase())))
                    .slice(0, 20)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onProfileUpdate({ university_id: u.id, university_name: u.name }).then(() => {
                            onUpdateUniversity();
                            setShowUniversitySearch(false);
                            setUniversitySearch('');
                          });
                        }}
                        className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-och-gold/20 text-white text-sm"
                      >
                        {u.name}
                        {u.short_name && <span className="text-och-steel block text-xs">{u.short_name}</span>}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function ProfileSection({
  profile,
  onUpdate,
  saving,
}: {
  profile: ProfileData | null;
  onUpdate: (u: Partial<ProfileData>) => Promise<void>;
  saving: boolean;
}) {
  const [local, setLocal] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    country: profile?.country ?? '',
    timezone: profile?.timezone ?? 'UTC',
    bio: profile?.bio ?? '',
    preferred_learning_style: profile?.preferred_learning_style ?? '',
    career_goals: profile?.career_goals ?? '',
  });

  useEffect(() => {
    if (profile) {
      setLocal({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        country: profile.country ?? '',
        timezone: profile.timezone ?? 'UTC',
        bio: profile.bio ?? '',
        preferred_learning_style: profile.preferred_learning_style ?? '',
        career_goals: profile.career_goals ?? '',
      });
    }
  }, [profile?.id, profile?.first_name, profile?.last_name, profile?.country, profile?.timezone, profile?.bio, profile?.preferred_learning_style, profile?.career_goals]);

  const handleSave = () => {
    onUpdate(local);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile & Identity</h2>
        <p className="text-och-steel">Manage your TalentScope baseline and portfolio data</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-och-steel uppercase tracking-widest mb-2">First Name</label>
            <input
              type="text"
              value={local.first_name}
              onChange={(e) => setLocal((p) => ({ ...p, first_name: e.target.value }))}
              className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-och-steel uppercase tracking-widest mb-2">Last Name</label>
            <input
              type="text"
              value={local.last_name}
              onChange={(e) => setLocal((p) => ({ ...p, last_name: e.target.value }))}
              className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none"
              placeholder="Last name"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-och-steel uppercase tracking-widest mb-2">Country</label>
          <input
            type="text"
            value={local.country}
            onChange={(e) => setLocal((p) => ({ ...p, country: e.target.value }))}
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none"
            placeholder="e.g. Kenya"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-och-steel uppercase tracking-widest mb-2">Timezone</label>
          <select
            value={local.timezone}
            onChange={(e) => setLocal((p) => ({ ...p, timezone: e.target.value }))}
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none"
          >
            <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
            <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
            <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-och-steel uppercase tracking-widest mb-2">Bio</label>
          <textarea
            rows={3}
            value={local.bio}
            onChange={(e) => setLocal((p) => ({ ...p, bio: e.target.value }))}
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none resize-none"
            placeholder="Short bio..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-och-steel uppercase tracking-widest mb-2">Preferred Learning Style</label>
          <textarea
            rows={2}
            value={local.preferred_learning_style}
            onChange={(e) => setLocal((p) => ({ ...p, preferred_learning_style: e.target.value }))}
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none resize-none"
            placeholder="Describe your preferred learning approach..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-och-steel uppercase tracking-widest mb-2">Career Goals</label>
          <textarea
            rows={2}
            value={local.career_goals}
            onChange={(e) => setLocal((p) => ({ ...p, career_goals: e.target.value }))}
            className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none resize-none"
            placeholder="Share your career aspirations..."
          />
        </div>
        <Button variant="defender" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </Card>
    </div>
  );
}

function SubscriptionSection({
  subscription,
  pathname,
  onUpgrade,
  onReload,
}: {
  subscription: SubscriptionData | null;
  pathname: string | null;
  onUpgrade: () => void;
  onReload: () => void;
}) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const tierDisplay = subscription?.tier ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1) : 'Free';
  const statusDisplay = subscription?.status === 'active' ? 'Active' : subscription?.status === 'past_due' ? 'Past Due' : subscription?.status === 'cancelled' ? 'Cancelled' : 'Inactive';
  const hasStudentSubscription = pathname?.includes('/student/');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Subscription & Access Control</h2>
        <p className="text-och-steel">Manage your subscription tier and feature entitlements</p>
      </div>

      {subscription && (
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-och-gold" />
                <p className="text-xs font-bold text-och-steel uppercase tracking-widest">Tier</p>
              </div>
              <p className="text-2xl font-bold text-white">{tierDisplay}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-och-defender" />
                <p className="text-xs font-bold text-och-steel uppercase tracking-widest">Status</p>
              </div>
              <p className="text-2xl font-bold text-white capitalize">{statusDisplay}</p>
            </div>
            {subscription.next_payment && (
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-och-mint" />
                  <p className="text-xs font-bold text-och-steel uppercase tracking-widest">Next Payment</p>
                </div>
                <p className="text-lg font-bold text-white">{formatDate(subscription.next_payment)}</p>
              </div>
            )}
          </div>

          {subscription.enhanced_access_until && subscription.days_enhanced_left !== undefined && (
            <div className="p-4 bg-och-gold/5 border border-och-gold/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white mb-1">Enhanced Access</p>
                  <p className="text-xs text-och-steel">
                    {subscription.days_enhanced_left > 0
                      ? `${subscription.days_enhanced_left} days remaining until ${formatDate(subscription.enhanced_access_until)}`
                      : `Expired on ${formatDate(subscription.enhanced_access_until)}`}
                  </p>
                </div>
                <Badge variant="gold">{subscription.days_enhanced_left > 0 ? 'Active' : 'Expired'}</Badge>
              </div>
            </div>
          )}

          {subscription.features?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Included Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subscription.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-och-mint flex-shrink-0" />
                    <span className="text-sm text-white">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {hasStudentSubscription && subscription.can_upgrade && subscription.tier !== 'professional' && (
              <Button variant="gold" onClick={onUpgrade}>
                Upgrade Subscription
              </Button>
            )}
            {hasStudentSubscription && (
              <Button variant="outline" onClick={onUpgrade}>
                Manage Subscription
              </Button>
            )}
            <Button variant="outline" onClick={onReload}>
              Refresh Status
            </Button>
          </div>
        </Card>
      )}

      {!subscription && (
        <Card className="p-6">
          <p className="text-och-steel">Loading subscription data...</p>
        </Card>
      )}
    </div>
  );
}

const PRIVACY_CONSENT_OPTIONS = [
  { id: 'share_with_mentor', label: 'Share with Mentor', description: 'Allow mentors to view your profile and progress', icon: Users },
  { id: 'public_portfolio', label: 'Public Portfolio', description: 'Make your portfolio visible to employers', icon: Eye },
  { id: 'employer_share', label: 'Employer Share', description: 'Allow employers to view your profile in marketplace', icon: Briefcase },
  { id: 'marketing', label: 'Marketing', description: 'Receive product updates and offers', icon: Mail },
  { id: 'analytics', label: 'Analytics', description: 'Help us improve by sharing usage insights', icon: Database },
];

function PrivacySection({
  consentScopes,
  onConsentUpdate,
  onExportRequest,
  onDeleteRequest,
}: {
  consentScopes: Record<string, boolean>;
  onConsentUpdate: (scope: string, granted: boolean) => Promise<void>;
  profile: ProfileData | null;
  onExportRequest: () => void;
  onDeleteRequest: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Privacy & Consent Management</h2>
        <p className="text-och-steel">Granular control over your data sharing and visibility</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Consent Scopes</h3>
        <p className="text-sm text-och-steel mb-6">
          Control who can access your data. Consent-First AI: you decide who sees what.
        </p>
        <div className="space-y-3">
          {PRIVACY_CONSENT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const enabled = !!consentScopes[opt.id];
            return (
              <div key={opt.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-och-defender/10 flex items-center justify-center border border-och-defender/20">
                    <Icon className="w-5 h-5 text-och-defender" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="text-xs text-och-steel">{opt.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onConsentUpdate(opt.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-och-steel/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-och-defender" />
                </label>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-och-mint" />
          <div>
            <h3 className="text-lg font-semibold text-white">Data Export (SAR)</h3>
            <p className="text-xs text-och-steel">Request a copy of your data (GDPR Right to Access)</p>
          </div>
        </div>
        <p className="text-sm text-och-steel mb-4">
          You have the right to request a copy of all personal data we hold about you.
        </p>
        <Button variant="outline" onClick={onExportRequest}>
          <Download className="w-4 h-4 mr-2" />
          Request Data Export
        </Button>
      </Card>

      <Card className="p-6 border-och-orange/20">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-och-orange" />
          <div>
            <h3 className="text-lg font-semibold text-white">Account Deletion</h3>
            <p className="text-xs text-och-steel">Request permanent deletion (GDPR Right to Erasure)</p>
          </div>
        </div>
        <p className="text-sm text-och-steel mb-4">
          Requesting account deletion will permanently remove all your data. This process may take up to 30 days.
        </p>
        <Button variant="outline" onClick={onDeleteRequest} className="border-och-orange/50 text-och-orange hover:bg-och-orange/10">
          <Trash2 className="w-4 h-4 mr-2" />
          Request Account Deletion
        </Button>
      </Card>
    </div>
  );
}

function SecuritySection({
  profile,
  activeSessions,
  onMFAEnable,
  onRevokeSession,
}: {
  profile: ProfileData | null;
  activeSessions: ActiveSession[];
  onMFAEnable: () => void;
  onRevokeSession: (sessionId: string) => void;
  onProfileUpdate: (u: Partial<ProfileData>) => Promise<void>;
}) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const diffMs = Date.now() - new Date(dateString).getTime();
      const mins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMs / 3600000);
      const days = Math.floor(diffMs / 86400000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins} min ago`;
      if (hours < 24) return `${hours} hr ago`;
      if (days < 7) return `${days} days ago`;
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Security & Access Control</h2>
        <p className="text-och-steel">Manage authentication, sessions, and account security</p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Authentication</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-och-mint" />
                <div>
                  <p className="text-sm font-bold text-white">Email Verification</p>
                  <p className="text-xs text-och-steel">{profile?.email ?? '—'}</p>
                  <p className="text-xs text-och-steel mt-1">
                    {profile?.email_verified ? 'Your email has been verified' : 'Please verify your email to secure your account'}
                  </p>
                </div>
              </div>
              {profile?.email_verified ? (
                <Badge variant="mint"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Verified</Badge>
              ) : (
                <Badge variant="orange"><XCircle className="w-3 h-3 mr-1 inline" /> Unverified</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-4">
                <Key className="w-5 h-5 text-och-defender" />
                <div>
                  <p className="text-sm font-bold text-white">Multi-Factor Authentication (MFA)</p>
                  <p className="text-xs text-och-steel">
                    {profile?.mfa_enabled ? 'MFA adds an extra layer of security' : 'Enable MFA to protect your account'}
                  </p>
                </div>
              </div>
              {profile?.mfa_enabled ? (
                <Badge variant="mint"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Enabled</Badge>
              ) : (
                <Button variant="defender" size="sm" onClick={onMFAEnable}>Enable MFA</Button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
          {activeSessions.length === 0 ? (
            <p className="text-och-steel text-sm p-4 bg-white/5 rounded-xl">No active sessions found</p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-och-mint/5 border border-och-mint/20 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Monitor className="w-5 h-5 text-och-mint" />
                    <div>
                      <p className="text-sm font-bold text-white">{session.device_info ?? 'Unknown device'}</p>
                      <p className="text-xs text-och-steel">
                        {session.location && <span>{session.location} · </span>}
                        {getTimeAgo(session.last_active)}
                        {session.current && <Badge variant="mint" className="ml-2 text-[9px]">Current</Badge>}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="outline" size="sm" onClick={() => onRevokeSession(session.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ExportModal({ onClose, onExport, saving }: any) {
  return (
    <div className="fixed inset-0 bg-och-midnight/90 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">Request Data Export (SAR)</h3>
        <p className="text-och-steel mb-6">
          Request a Subject Access Request (SAR) to export your data in a machine-readable format.
        </p>
        <div className="space-y-4">
          <Button variant="defender" onClick={() => onExport('json')} disabled={saving} className="w-full">
            Export as JSON
          </Button>
          <Button variant="outline" onClick={() => onExport('csv')} disabled={saving} className="w-full">
            Export as CSV
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="w-full">
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

function DeleteAccountModal({ onClose, onConfirm, saving }: any) {
  return (
    <div className="fixed inset-0 bg-och-midnight/90 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-och-orange mb-4">Request Account Deletion</h3>
        <p className="text-och-steel mb-6">
          This will request permanent deletion of your account and all associated data (Right to be Forgotten).
          This process may take up to 30 days.
        </p>
        <div className="space-y-4">
          <Button variant="defender" onClick={onConfirm} disabled={saving} className="w-full bg-och-orange">
            {saving ? 'Processing...' : 'Confirm Deletion'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="w-full">
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}










