'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Key, AlertCircle, CheckCircle2, XCircle, LogOut, Eye, EyeOff, Mail, Monitor, MapPin, Clock, Smartphone, Laptop, Tablet, Globe
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { apiGateway } from '@/services/apiGateway';
import { djangoClient } from '@/services/djangoClient';

interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  mfa_enabled?: boolean;
  email_verified?: boolean;
  account_status?: string;
  is_active?: boolean;
}

interface ActiveSession {
  id: string;
  device_name?: string;
  device_type?: string;
  device_info?: string;
  ip_address?: string;
  location?: string;
  last_active: string;
  last_activity?: string;
  created_at?: string;
  current?: boolean;
  is_trusted?: boolean;
  mfa_verified?: boolean;
  ua?: string; // User agent
}

export function OCHSettingsSecurity() {
  const router = useRouter();
  const { user, reloadUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [showMFAEnable, setShowMFAEnable] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [user?.id]);

  useEffect(() => {
    if (!profile?.email_verified) {
      // Set up periodic refresh to check email verification status
      const refreshInterval = setInterval(() => {
        loadProfile();
      }, 30000); // Check every 30 seconds if email is not verified
      
      // Refresh when user returns to the tab/window (after email verification)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadProfile();
        }
      };
      
      // Refresh when window regains focus (user comes back from email verification)
      const handleFocus = () => {
        loadProfile();
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(refreshInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [profile?.email_verified]);

  const loadAllData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadProfile(),
        loadActiveSessions(),
      ]);
    } catch (err: any) {
      console.error('Failed to load security data:', err);
      setError(err?.message || 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      // Use /profile endpoint which returns full UserSerializer data including email_verified
      const data = await apiGateway.get<any>('/profile').catch(async () => {
        // Fallback to /auth/me if /profile fails
        return await apiGateway.get<any>('/auth/me');
      });
      
      // Backend /profile returns full serializer data with email_verified
      // Backend /auth/me returns { user: {...}, roles: [...], consent_scopes: [...], entitlements: [...] }
      const userData = (data as any).user || data;
      
      // Determine email verification status from multiple sources
      const emailVerified = 
        (userData as any).email_verified || 
        (data as any).email_verified || 
        ((userData as any).account_status === 'active' && (userData as any).is_active) ||
        ((data as any).account_status === 'active' && (data as any).is_active);
      
      const profileData = {
        id: (userData as any).id || (data as any).id,
        email: (userData as any).email || (data as any).email || user?.email || '',
        first_name: (userData as any).first_name || (data as any).first_name,
        last_name: (userData as any).last_name || (data as any).last_name,
        mfa_enabled: (userData as any).mfa_enabled || (data as any).mfa_enabled || false,
        email_verified: emailVerified,
        account_status: (userData as any).account_status || (data as any).account_status,
        is_active: userData.is_active !== undefined ? userData.is_active : (data.is_active !== undefined ? data.is_active : true),
      };
      
      setProfile(profileData);
      
      // If email was just verified, reload user data
      if (emailVerified && !profile?.email_verified) {
        await reloadUser();
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err?.message || 'Failed to load profile');
    }
  };

  const handleResendVerification = async () => {
    if (!profile?.email) {
      setError('Email address not found');
      return;
    }

    setResendingVerification(true);
    setError(null);
    setSaveStatus(null);

    try {
      // Request a new verification email
      // Note: This requires a backend endpoint for resending verification emails
      // For now, we'll use the magic link endpoint as a workaround
      await apiGateway.post('/auth/login/magic-link/', {
        email: profile.email,
      });

      setVerificationSent(true);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus(null);
        setVerificationSent(false);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to resend verification email:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to resend verification email. Please check your email inbox or contact support.');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setResendingVerification(false);
    }
  };

  const handleRefreshVerification = async () => {
    await loadProfile();
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const loadActiveSessions = async () => {
    try {
      // Try to get sessions from the user's sessions relationship
      // The endpoint might be /auth/sessions/ or we might need to get it from profile
      const sessions = await apiGateway.get('/auth/sessions/').catch(async () => {
        // Fallback: Try to get sessions from user profile or create a sessions endpoint
        // For now, return empty array if endpoint doesn't exist
        return [];
      });
      
      // Normalize session data
      const normalizedSessions = (Array.isArray(sessions) ? sessions : []).map((session: any) => ({
        id: session.id || session.session_id,
        device_name: session.device_name || session.device_info || 'Unknown Device',
        device_type: session.device_type || 'unknown',
        device_info: session.device_info || session.device_name,
        ip_address: session.ip_address || session.ip,
        location: session.location,
        last_active: session.last_active || session.last_activity || session.updated_at || session.created_at,
        created_at: session.created_at,
        current: session.current || session.is_current || false,
        is_trusted: session.is_trusted || false,
        mfa_verified: session.mfa_verified || false,
        ua: session.ua || session.user_agent,
      }));
      
      // Filter to show only the current session for better UX
      const currentSession = normalizedSessions.find(s => s.current) || normalizedSessions[0];
      setActiveSessions(currentSession ? [currentSession] : []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setActiveSessions([]);
    }
  };

  const handleMFAEnable = async () => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      // Navigate to MFA setup page or trigger MFA setup flow
      router.push('/dashboard/student/settings/security?mfa=true');
      setShowMFAEnable(false);
    } catch (err: any) {
      console.error('Error enabling MFA:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to enable MFA');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      await apiGateway.delete(`/auth/sessions/${sessionId}/`);
      await loadActiveSessions();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error revoking session:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to revoke session');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? You will need to log in again on other devices.')) {
      return;
    }

    setSaving(true);
    setSaveStatus(null);
    
    try {
      // Revoke all sessions except current
      const otherSessions = activeSessions.filter(s => !s.current);
      await Promise.all(
        otherSessions.map(session => apiGateway.delete(`/auth/sessions/${session.id}/`))
      );
      await loadActiveSessions();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error revoking sessions:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to revoke sessions');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'desktop':
        return Laptop;
      default:
        return Monitor;
    }
  };

  const getDeviceTypeLabel = (deviceType?: string) => {
    if (!deviceType) return 'Unknown';
    return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-och-steel font-black uppercase tracking-widest text-xs">Loading Security Settings...</p>
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
              <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Security Settings</h2>
              <p className="text-och-steel mb-6">{error}</p>
              <Button variant="defender" onClick={loadAllData}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
              <Shield className="w-8 h-8 text-och-orange" />
              Security & Access Control
            </h1>
            <p className="text-och-steel text-sm italic max-w-2xl">
              Manage authentication, sessions, and account security settings
            </p>
          </div>
        </div>

        {/* Section 1: Authentication */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-orange/10 flex items-center justify-center border border-och-orange/20">
              <Key className="w-6 h-6 text-och-orange" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Authentication</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Secure your account with multi-factor authentication</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email Verification */}
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-och-mint/10 flex items-center justify-center border border-och-mint/20">
                  <Mail className="w-5 h-5 text-och-mint" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Email Verification</p>
                  {profile?.email ? (
                    <p className="text-sm text-white mb-1 font-medium">
                      {profile.email}
                    </p>
                  ) : (
                    <p className="text-xs text-och-steel mb-1 italic">
                      Loading email address...
                    </p>
                  )}
                  <p className="text-xs text-och-steel">
                    {profile?.email_verified 
                      ? 'Your email address has been verified'
                      : 'Please verify your email address to secure your account'}
                  </p>
                  {verificationSent && (
                    <p className="text-xs text-och-mint mt-1">
                      Verification email sent! Please check your inbox.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {profile?.email_verified ? (
                  <Badge variant="mint" className="text-xs font-black uppercase">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <>
                    <Badge variant="orange" className="text-xs font-black uppercase">
                      <XCircle className="w-3 h-3 mr-1" />
                      Unverified
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshVerification}
                      disabled={saving}
                      title="Refresh verification status"
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={resendingVerification || saving}
                    >
                      {resendingVerification ? 'Sending...' : 'Resend Email'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Multi-Factor Authentication */}
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-och-defender/10 flex items-center justify-center border border-och-defender/20">
                  <Shield className="w-5 h-5 text-och-defender" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">Multi-Factor Authentication (MFA)</p>
                  <p className="text-xs text-och-steel">
                    {profile?.mfa_enabled 
                      ? 'Add an extra layer of security to your account'
                      : 'Enable MFA to protect your account from unauthorized access'}
                  </p>
                </div>
              </div>
              {profile?.mfa_enabled ? (
                <div className="flex items-center gap-3">
                  <Badge variant="mint" className="text-xs font-black uppercase">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/student/settings/security?mfa=manage')}
                    disabled={saving}
                  >
                    Manage
                  </Button>
                </div>
              ) : (
                <Button
                  variant="defender"
                  size="sm"
                  onClick={() => setShowMFAEnable(true)}
                  disabled={saving}
                >
                  Enable MFA
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Section 2: Current Session */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-och-mint/10 flex items-center justify-center border border-och-mint/20">
                <Monitor className="w-6 h-6 text-och-mint" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Current Session</h2>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Your active device and connection details</p>
              </div>
            </div>
          </div>

          {activeSessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-och-steel">No active session found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device_type);
                const deviceName = session.device_name || session.device_info || 'Unknown Device';
                
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-och-mint/5 border border-och-mint/30 rounded-xl"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center border bg-och-mint/10 border-och-mint/20">
                        <DeviceIcon className="w-5 h-5 text-och-mint" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-bold text-white">
                            {deviceName}
                          </p>
                          {session.device_type && (
                            <Badge variant="steel" className="text-[9px] font-black uppercase">
                              {getDeviceTypeLabel(session.device_type)}
                            </Badge>
                          )}
                          <Badge variant="mint" className="text-[9px] font-black uppercase">
                            Active
                          </Badge>
                          {session.is_trusted && (
                            <Badge variant="gold" className="text-[9px] font-black uppercase">
                              Trusted
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-och-steel">
                          {session.ip_address && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span className="font-mono">{session.ip_address}</span>
                            </div>
                          )}
                          {session.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(session.last_active)}
                          </div>
                        </div>
                        {session.created_at && (
                          <p className="text-[10px] text-och-steel mt-1">
                            Session started: {formatDate(session.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Section 3: Security Recommendations */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-gold/10 flex items-center justify-center border border-och-gold/20">
              <Shield className="w-6 h-6 text-och-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Security Recommendations</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Best practices to keep your account secure</p>
            </div>
          </div>

          <div className="space-y-3">
            {!profile?.email_verified && (
              <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Verify Your Email</p>
                  <p className="text-xs text-och-steel">
                    Verifying your email address helps secure your account and enables password recovery.
                  </p>
                </div>
              </div>
            )}

            {!profile?.mfa_enabled && (
              <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Enable Multi-Factor Authentication</p>
                  <p className="text-xs text-och-steel">
                    MFA adds an extra layer of security by requiring a second verification step when logging in.
                  </p>
                </div>
              </div>
            )}

            {activeSessions.filter(s => !s.current).length > 3 && (
              <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Review Active Sessions</p>
                  <p className="text-xs text-och-steel">
                    You have multiple active sessions. Consider revoking sessions from devices you no longer use.
                  </p>
                </div>
              </div>
            )}

            {profile?.email_verified && profile?.mfa_enabled && activeSessions.filter(s => !s.current).length <= 3 && (
              <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Your Account is Secure</p>
                  <p className="text-xs text-och-steel">
                    You've enabled all recommended security features. Keep up the good work!
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* MFA Enable Modal */}
        <AnimatePresence>
          {showMFAEnable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowMFAEnable(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-och-midnight border border-och-steel/20 rounded-2xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-white mb-4">Enable Multi-Factor Authentication</h3>
                <p className="text-sm text-och-steel mb-6">
                  Multi-Factor Authentication adds an extra layer of security to your account. 
                  You'll need to verify your identity using a second method (like a code from an app) 
                  when logging in.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="defender"
                    onClick={handleMFAEnable}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? 'Setting up...' : 'Continue Setup'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowMFAEnable(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


