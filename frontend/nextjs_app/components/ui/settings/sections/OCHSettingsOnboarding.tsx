'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, AlertCircle, GraduationCap, Target, User, Shield
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { djangoClient } from '@/services/djangoClient';
import { apiGateway } from '@/services/apiGateway';
import { profilerClient } from '@/services/profilerClient';
import clsx from 'clsx';

interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country?: string;
  timezone?: string;
  mfa_enabled?: boolean;
  email_verified?: boolean;
  is_active?: boolean;
  university_id?: number;
  university_name?: string;
  role_specific_data?: {
    student?: {
      profiler_completed?: boolean;
      track_name?: string;
      cohort_name?: string;
    };
  };
}

interface ProfilerStatus {
  completed: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  sections_completed: string[];
  future_you_completed: boolean;
}

interface University {
  id: number;
  name: string;
  short_name?: string;
  country?: string;
  slug: string;
}

interface OnboardingChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  actionUrl?: string;
}

export function OCHSettingsOnboarding() {
  const router = useRouter();
  const { user, reloadUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profilerStatus, setProfilerStatus] = useState<ProfilerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [showUniversitySearch, setShowUniversitySearch] = useState(false);
  const [universitySearch, setUniversitySearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, [user?.id]);

  const loadAllData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadProfile(),
        loadProfilerStatus(),
        loadUniversities(),
      ]);
    } catch (err: any) {
      console.error('Failed to load onboarding data:', err);
      setError(err?.message || 'Failed to load onboarding data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const profileData = await djangoClient.users.getProfile();
      setProfile(profileData as any);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    }
  };

  const loadProfilerStatus = async () => {
    try {
      if (!user?.id) return;
      const data = await profilerClient.getStatus(user.id.toString());
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

  const loadUniversities = async () => {
    try {
      const response = await apiGateway.get('/community/universities/', {
        params: { page_size: 100 }
      });
      setUniversities(Array.isArray((response as any).results) ? (response as any).results : response);
    } catch (err) {
      console.error('Error loading universities:', err);
    }
  };

  const handleProfileUpdate = async (updates: Partial<ProfileData>) => {
    if (!profile) return;

    setSaving(true);
    setSaveStatus(null);
    try {
      await djangoClient.users.updateProfile(updates as any);
      await reloadUser();
      await loadProfile();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setSaveStatus('error');
      setError(err.message || 'Failed to save profile. Please try again.');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const getOnboardingChecklist = (): OnboardingChecklistItem[] => {
    if (!profile) return [];
    
    return [
      {
        id: 'identity_verification',
        label: 'Identity Verification',
        description: 'Register and verify your account via Email, Google SSO, or Apple ID',
        completed: !!(profile.email_verified && profile.is_active),
        required: true,
      },
      {
        id: 'tier0_profiler',
        label: 'Tier 0 Profiler',
        description: 'Complete aptitude and technical reasoning assessment',
        completed: !!(profile.role_specific_data?.student?.profiler_completed || profilerStatus?.completed),
        required: true,
        actionUrl: '/dashboard/student/profiling',
      },
      {
        id: 'profile_completion',
        label: 'Profile Completion',
        description: 'Complete core metadata: name, country, timezone',
        completed: !!(profile.first_name && profile.last_name && profile.country && profile.timezone),
        required: false,
        actionUrl: '/dashboard/student/settings/profile',
      },
      {
        id: 'university_mapping',
        label: 'University Mapping',
        description: 'Connect to your university community',
        completed: !!(profile.university_id || profile.university_name),
        required: false,
      },
      {
        id: 'mfa_setup',
        label: 'MFA Security (Recommended)',
        description: 'Enable Multi-Factor Authentication to protect your data',
        completed: profile.mfa_enabled || false,
        required: false,
        actionUrl: '/dashboard/student/settings/security',
      },
    ];
  };

  const getOnboardingProgress = (): number => {
    const checklist = getOnboardingChecklist();
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-och-steel font-black uppercase tracking-widest text-xs">Loading Onboarding Status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-och-orange mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Onboarding</h2>
              <p className="text-och-steel mb-6">{error}</p>
              <Button variant="defender" onClick={loadAllData}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const checklist = getOnboardingChecklist();
  const progress = getOnboardingProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
          {saveStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <p className="text-green-400 text-sm">Settings updated successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
              <Target className="w-8 h-8 text-och-gold" />
              Initial Setup & Onboarding
            </h1>
            <p className="text-och-steel text-sm italic max-w-2xl">
              Complete your account setup to unlock full OCH features and access to the platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="mint" className="text-xs font-black uppercase">
              {progress}% Complete
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Onboarding Progress</h3>
            <Badge variant={progress >= 80 ? 'mint' : progress >= 50 ? 'orange' : 'steel'}>
              {progress}%
            </Badge>
          </div>
          <div className="w-full bg-och-midnight rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-och-mint to-och-gold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        {/* Section 1: Onboarding Checklist */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-defender/10 flex items-center justify-center border border-och-defender/20">
              <CheckCircle2 className="w-6 h-6 text-och-defender" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Onboarding Checklist</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Complete these to unlock full platform access</p>
            </div>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all",
                  item.completed
                    ? "bg-green-500/5 border-green-500/20"
                    : item.required
                    ? "bg-orange-500/5 border-orange-500/20"
                    : "bg-white/5 border-white/5"
                )}
              >
                <div className="mt-0.5">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className={clsx("w-5 h-5", item.required ? "text-orange-400" : "text-och-steel")} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{item.label}</h3>
                    {item.required && (
                      <Badge variant="orange" className="text-[9px] font-black uppercase">Required</Badge>
                    )}
                  </div>
                  <p className="text-xs text-och-steel">{item.description}</p>
                </div>
                {!item.completed && item.actionUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(item.actionUrl!)}
                  >
                    Complete
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Section 2: University Mapping */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-mint/10 flex items-center justify-center border border-och-mint/20">
              <GraduationCap className="w-6 h-6 text-och-mint" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">University Mapping</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Join your local university community</p>
            </div>
          </div>

          <div className="space-y-4">
            {profile?.university_name ? (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{profile.university_name}</p>
                    <p className="text-xs text-och-steel mt-1">You're connected to your university community</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleProfileUpdate({ university_id: null, university_name: null });
                    }}
                    disabled={saving}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-och-steel mb-4">
                  The system attempts to auto-map you based on your email domain (e.g., @uon.ac.ke). 
                  If auto-mapping failed, manually select your institution.
                </p>
                <Button
                  variant="defender"
                  onClick={() => setShowUniversitySearch(!showUniversitySearch)}
                  disabled={saving}
                >
                  {showUniversitySearch ? 'Cancel' : 'Select University'}
                </Button>

                {showUniversitySearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-3"
                  >
                    <input
                      type="text"
                      value={universitySearch}
                      onChange={(e) => setUniversitySearch(e.target.value)}
                      placeholder="Search universities..."
                      className="w-full px-4 py-3 bg-black/40 border border-och-steel/20 rounded-xl text-white text-sm focus:border-och-gold focus:outline-none"
                    />
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {universities
                        .filter(uni => 
                          !universitySearch || 
                          uni.name.toLowerCase().includes(universitySearch.toLowerCase()) ||
                          uni.short_name?.toLowerCase().includes(universitySearch.toLowerCase())
                        )
                        .slice(0, 20)
                        .map(uni => (
                          <button
                            key={uni.id}
                            onClick={() => {
                              handleProfileUpdate({ university_id: uni.id, university_name: uni.name });
                              setShowUniversitySearch(false);
                              setUniversitySearch('');
                            }}
                            className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-och-gold/20 transition-all"
                          >
                            <p className="text-sm font-bold text-white">{uni.name}</p>
                            {uni.short_name && (
                              <p className="text-xs text-och-steel">{uni.short_name}</p>
                            )}
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Section 3: Quick Actions */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-gold/10 flex items-center justify-center border border-och-gold/20">
              <Target className="w-6 h-6 text-och-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Quick Actions</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Get started with these essential steps</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!profilerStatus?.completed && (
              <Button
                variant="defender"
                size="lg"
                onClick={() => router.push('/dashboard/student/profiling')}
                className="flex items-center gap-3 justify-start"
              >
                <Target className="w-5 h-5" />
                Start TalentScope Profiler
              </Button>
            )}
            
            {(!profile?.first_name || !profile?.last_name || !profile?.country || !profile?.timezone) && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard/student/settings/profile')}
                className="flex items-center gap-3 justify-start"
              >
                <User className="w-5 h-5" />
                Complete Profile
              </Button>
            )}

            {!profile?.mfa_enabled && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard/student/settings/security')}
                className="flex items-center gap-3 justify-start"
              >
                <Shield className="w-5 h-5" />
                Enable MFA Security
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

