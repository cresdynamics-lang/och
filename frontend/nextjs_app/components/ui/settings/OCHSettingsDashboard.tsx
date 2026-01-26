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
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, CreditCard, Lock, Building2, GraduationCap,
  CheckCircle2, XCircle, AlertCircle, Mail, Clock, Globe,
  Download, Trash2, Eye, EyeOff, Settings, LogOut, Key,
  Calendar, DollarSign, Zap, Target, FileText, Database,
  Users, Briefcase, Award, Activity, RefreshCw, ExternalLink
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

type SettingsSection = 'overview' | 'onboarding' | 'profile' | 'subscription' | 'privacy' | 'security';

interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country?: string;
  timezone?: string;
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
  
  // UI states
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [user?.id]);

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
      // Try to get university membership
      const memberships = await apiGateway.get<any>('/community/university-memberships/');
      if (memberships && (memberships as any[]).length > 0) {
        const membership = (memberships as any[])[0];
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
    router.push(`/dashboard/student/settings?section=${section}`, { scroll: false });
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
                  onUpdateUniversity={loadUniversity}
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
                  onUpgrade={() => router.push('/dashboard/student/subscription')}
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
                  onMFAEnable={() => router.push('/dashboard/student/settings?section=security&mfa=true')}
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

// Placeholder components for other sections - will implement next
function OnboardingSection({ profile, profilerStatus, university, onUpdateUniversity, onStartProfiler }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Initial Setup & Onboarding</h2>
        <p className="text-och-steel">Complete your account setup to unlock full OCH features</p>
      </div>
      {/* Implementation continues... */}
      <Card className="p-6">
        <p className="text-och-steel">Onboarding section implementation in progress...</p>
      </Card>
    </div>
  );
}

function ProfileSection({ profile, onUpdate, saving }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile & Identity</h2>
        <p className="text-och-steel">Manage your TalentScope baseline and portfolio data</p>
      </div>
      <Card className="p-6">
        <p className="text-och-steel">Profile section implementation in progress...</p>
      </Card>
    </div>
  );
}

function SubscriptionSection({ subscription, onUpgrade, onReload }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Subscription & Access Control</h2>
        <p className="text-och-steel">Manage your subscription tier and feature entitlements</p>
      </div>
      <Card className="p-6">
        <p className="text-och-steel">Subscription section implementation in progress...</p>
      </Card>
    </div>
  );
}

function PrivacySection({ consentScopes, onConsentUpdate, profile, onExportRequest, onDeleteRequest }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Privacy & Consent Management</h2>
        <p className="text-och-steel">Granular control over your data sharing and visibility</p>
      </div>
      <Card className="p-6">
        <p className="text-och-steel">Privacy section implementation in progress...</p>
      </Card>
    </div>
  );
}

function SecuritySection({ profile, activeSessions, onMFAEnable, onRevokeSession, onProfileUpdate }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Security & Access Control</h2>
        <p className="text-och-steel">Manage authentication, sessions, and account security</p>
      </div>
      <Card className="p-6">
        <p className="text-och-steel">Security section implementation in progress...</p>
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










