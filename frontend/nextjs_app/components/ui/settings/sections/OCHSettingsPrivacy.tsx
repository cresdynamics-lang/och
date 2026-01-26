'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertCircle, Download, Trash2, Eye, EyeOff, Users, Briefcase, CheckCircle2, FileText, Database
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { djangoClient } from '@/services/djangoClient';
import { apiGateway } from '@/services/apiGateway';
import type { ConsentUpdate } from '@/services/types/user';

interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  consent_scopes?: string[];
}

export function OCHSettingsPrivacy() {
  const router = useRouter();
  const { user, reloadUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [consentScopes, setConsentScopes] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiGateway.get<any>('/auth/me');
      setProfile(data as any);
      setConsentScopes((data as any).consent_scopes || []);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err?.message || 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentUpdate = async (scopeType: string, granted: boolean) => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const update: ConsentUpdate = {
        scope_type: scopeType,
        granted,
      };
      await djangoClient.auth.updateConsent(update);
      await loadProfile();
      await reloadUser();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error('Error updating consent:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to update consent');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDataExport = async (format: 'json' | 'csv') => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const response = await apiGateway.post<any>('/auth/data-export/', { format });
      setSaveStatus('success');
      setShowExportModal(false);
      alert(`Data export requested. You will be notified when it's ready. Export ID: ${(response as any).id}`);
    } catch (err: any) {
      console.error('Error requesting data export:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to request data export');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDataDeletion = async () => {
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const response = await apiGateway.post('/auth/data-erasure/', {
        erasure_type: 'full',
        reason: 'User requested account deletion',
      });
      setSaveStatus('success');
      setShowDeleteModal(false);
      alert('Account deletion requested. This process may take up to 30 days. You will receive a confirmation email.');
      // Optionally log out user after a delay
      setTimeout(() => {
        router.push('/auth/logout');
      }, 5000);
    } catch (err: any) {
      console.error('Error requesting data deletion:', err);
      setSaveStatus('error');
      setError(err?.message || 'Failed to request account deletion');
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const consentOptions = [
    {
      id: 'share_with_mentor',
      label: 'Share with Mentor',
      description: 'Allow mentors to view your profile and progress',
      icon: Users,
    },
    {
      id: 'public_portfolio',
      label: 'Public Portfolio',
      description: 'Make your portfolio visible to employers',
      icon: Eye,
    },
    {
      id: 'employer_share',
      label: 'Employer Share',
      description: 'Allow employers to view your profile in marketplace',
      icon: Briefcase,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-och-steel font-black uppercase tracking-widest text-xs">Loading Privacy Settings...</p>
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
              <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Privacy Settings</h2>
              <p className="text-och-steel mb-6">{error}</p>
              <Button variant="defender" onClick={loadProfile}>Retry</Button>
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
              <Shield className="w-8 h-8 text-och-defender" />
              Privacy & Consent Management
            </h1>
            <p className="text-och-steel text-sm italic max-w-2xl">
              Granular control over your data sharing and visibility. Consent-First AI: You decide who sees what.
            </p>
          </div>
        </div>

        {/* Section 1: Consent Management */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-defender/10 flex items-center justify-center border border-och-defender/20">
              <Shield className="w-6 h-6 text-och-defender" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Consent Scopes</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Control who can access your data</p>
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-6">
            <p className="text-xs text-och-steel italic">
              Through the Consent Center, manage your consent scopes to determine if your profile and profiling 
              results are shared with mentors, displayed publicly, or made visible to employers.
            </p>
          </div>

          <div className="space-y-3">
            {consentOptions.map((option) => {
              const Icon = option.icon;
              const isEnabled = consentScopes.includes(option.id);
              
              return (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-och-defender/10 flex items-center justify-center border border-och-defender/20">
                      <Icon className="w-5 h-5 text-och-defender" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-1">{option.label}</p>
                      <p className="text-xs text-och-steel">{option.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleConsentUpdate(option.id, e.target.checked)}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-och-steel/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-och-defender peer-disabled:opacity-50"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Section 2: Data Export */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-mint/10 flex items-center justify-center border border-och-mint/20">
              <Download className="w-6 h-6 text-och-mint" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Data Export</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Request a copy of your data (GDPR Right to Access)</p>
            </div>
          </div>

          <div className="p-4 bg-och-mint/5 border border-och-mint/20 rounded-xl mb-6">
            <p className="text-sm text-och-steel mb-4">
              You have the right to request a copy of all personal data we hold about you. 
              This includes your profile, TalentScope results, activity history, and all associated metadata.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              disabled={saving}
            >
              <Download className="w-4 h-4 mr-2" />
              Request Data Export
            </Button>
          </div>
        </Card>

        {/* Section 3: Data Deletion */}
        <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-och-orange/10 flex items-center justify-center border border-och-orange/20">
              <Trash2 className="w-6 h-6 text-och-orange" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Account Deletion</h2>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Request permanent deletion of your account (GDPR Right to Erasure)</p>
            </div>
          </div>

          <div className="p-4 bg-och-orange/5 border border-och-orange/20 rounded-xl mb-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-och-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white mb-2">Warning: This action cannot be undone</p>
                <p className="text-xs text-och-steel">
                  Requesting account deletion will permanently remove all your data from our systems. 
                  This process may take up to 30 days to complete. You will receive a confirmation email 
                  once the deletion is processed.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              disabled={saving}
              className="border-och-orange/50 text-och-orange hover:bg-och-orange/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Request Account Deletion
            </Button>
          </div>
        </Card>

        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowExportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-och-midnight border border-och-steel/20 rounded-2xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-white mb-4">Request Data Export</h3>
                <p className="text-sm text-och-steel mb-4">
                  Choose the format for your data export:
                </p>
                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                    <input
                      type="radio"
                      name="format"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                      className="w-4 h-4 text-och-defender"
                    />
                    <FileText className="w-5 h-5 text-och-mint" />
                    <div>
                      <p className="text-sm font-medium text-white">JSON</p>
                      <p className="text-xs text-och-steel">Machine-readable format</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                      className="w-4 h-4 text-och-defender"
                    />
                    <Database className="w-5 h-5 text-och-mint" />
                    <div>
                      <p className="text-sm font-medium text-white">CSV</p>
                      <p className="text-xs text-och-steel">Spreadsheet-compatible format</p>
                    </div>
                  </label>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="mint"
                    onClick={() => handleRequestDataExport(exportFormat)}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? 'Requesting...' : 'Request Export'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowExportModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-och-midnight border border-och-orange/20 rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-och-orange" />
                  <h3 className="text-xl font-bold text-white">Confirm Account Deletion</h3>
                </div>
                <p className="text-sm text-och-steel mb-6">
                  Are you sure you want to request permanent deletion of your account? 
                  This action cannot be undone and all your data will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleRequestDataDeletion()}
                    disabled={saving}
                    className="flex-1 border-och-orange/50 text-och-orange hover:bg-och-orange/10"
                  >
                    {saving ? 'Requesting...' : 'Confirm Deletion'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
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


