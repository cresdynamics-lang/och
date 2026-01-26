/**
 * Security Control Panel Component
 * Password change, 2FA, active sessions management
 * Enhanced with login history, security alerts, API keys, and 2FA backup codes
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Smartphone, Monitor, MapPin, Clock, LogOut, Key, AlertTriangle, Eye, EyeOff, Copy, CheckCircle2, History, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Local types to replace missing @/lib/settings imports
export interface UserSettings {
  activeSessions?: any[];
  twoFactorEnabled?: boolean;
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface SecurityControlPanelProps {
  settings: UserSettings;
  updateSettings: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function SecurityControlPanel({ settings, updateSettings, userId }: SecurityControlPanelProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [activeSessions, setActiveSessions] = useState(settings?.activeSessions || []);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [showSecurityAlerts, setShowSecurityAlerts] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Portfolio API', key: 'sk_live_••••••••••••••••', lastUsed: '2024-01-10T14:30:00Z', created: '2023-12-01T10:00:00Z' },
  ]);

  // Mock login history - in production, fetch from API
  const loginHistory = [
    { id: '1', timestamp: '2024-01-15T10:30:00Z', ip: '192.168.1.1', location: 'Nairobi, Kenya', device: 'Chrome on Windows', success: true },
    { id: '2', timestamp: '2024-01-14T15:45:00Z', ip: '192.168.1.1', location: 'Nairobi, Kenya', device: 'Chrome on Windows', success: true },
    { id: '3', timestamp: '2024-01-13T09:20:00Z', ip: '41.203.12.45', location: 'Lagos, Nigeria', device: 'Safari on iOS', success: true },
    { id: '4', timestamp: '2024-01-12T22:10:00Z', ip: '192.168.1.1', location: 'Nairobi, Kenya', device: 'Chrome on Windows', success: false },
  ];

  // Mock security alerts - in production, fetch from API
  const securityAlerts = [
    { id: '1', type: 'suspicious_login', message: 'Login attempt from new location (Lagos, Nigeria)', timestamp: '2024-01-13T09:20:00Z', resolved: true },
    { id: '2', type: 'failed_login', message: 'Multiple failed login attempts detected', timestamp: '2024-01-12T22:10:00Z', resolved: true },
    { id: '3', type: 'password_change', message: 'Password changed successfully', timestamp: '2024-01-10T14:00:00Z', resolved: true },
  ];

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      // TODO: Replace with actual Django API password change endpoint
      // const response = await apiGateway.post('/auth/change-password', {
      //   current_password: passwordData.current,
      //   new_password: passwordData.new,
      // });
      
      console.log('Password change mock triggered');
      alert('Password updated successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
      setIsChangingPassword(false);
    } catch (error: any) {
      console.error('Password change failed:', error);
      alert(`Failed to update password: ${error.message}`);
    }
  };

  const handleToggle2FA = async () => {
    if (!settings.twoFactorEnabled) {
      // Enable 2FA - generate backup codes
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(codes);
      setShowBackupCodes(true);
    }
    updateSettings({ twoFactorEnabled: !settings.twoFactorEnabled });
  };

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
    setShowBackupCodes(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleRevokeSession = async (sessionId: string) => {
    // TODO: Implement session revocation
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Password Change */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Password & Security</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your account password and authentication
              </p>
            </div>
          </div>

          {!isChangingPassword ? (
            <Button
              variant="outline"
              onClick={() => setIsChangingPassword(true)}
              className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="defender"
                  onClick={handlePasswordChange}
                  disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
                >
                  Update Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ current: '', new: '', confirm: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">Two-Factor Authentication</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {settings.twoFactorEnabled ? (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-300">
                2FA is enabled. You'll be asked for a verification code when signing in from new devices.
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
                2FA is disabled. Enable it to protect your account from unauthorized access.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="w-8 h-8 text-indigo-400" />
            <div>
              <h3 className="text-xl font-bold text-slate-100">Active Sessions</h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage devices where you're currently signed in
              </p>
            </div>
          </div>

          {activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <Monitor className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{session.device}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.lastActive).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No active sessions found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Login History */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">Login History</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review recent login attempts and sessions
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLoginHistory(!showLoginHistory)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showLoginHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showLoginHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                {loginHistory.map((login) => (
                  <div
                    key={login.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      login.success
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        login.success ? 'bg-emerald-500/20' : 'bg-red-500/20'
                      }`}>
                        {login.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-slate-200">
                            {login.success ? 'Successful login' : 'Failed login attempt'}
                          </div>
                          <Badge
                            variant={login.success ? 'mint' : 'steel'}
                            className={login.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
                          >
                            {login.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {login.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {login.device}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(login.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">IP: {login.ip}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    View All History
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Security Alerts */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">Security Alerts</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Recent security events and notifications
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSecurityAlerts(!showSecurityAlerts)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showSecurityAlerts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showSecurityAlerts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                {securityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      alert.resolved
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <AlertTriangle className={`w-5 h-5 ${alert.resolved ? 'text-slate-500' : 'text-amber-400'}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-200">{alert.message}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {alert.resolved ? (
                      <Badge variant="steel" className="bg-emerald-500/20 text-emerald-400">
                        Resolved
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* API Keys */}
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-100">API Keys</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage API keys for programmatic access
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showApiKeys ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {showApiKeys && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4"
              >
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-medium text-slate-200">{apiKey.name}</div>
                        <Badge variant="outline" className="text-[10px]">Active</Badge>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mb-2">{apiKey.key}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Created: {new Date(apiKey.created).toLocaleDateString()}</span>
                        <span>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          if (confirm('Are you sure you want to revoke this API key?')) {
                            setApiKeys(apiKeys.filter(k => k.id !== apiKey.id));
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="defender"
                  className="w-full"
                  onClick={() => {
                    const newKey = {
                      id: Date.now().toString(),
                      name: 'New API Key',
                      key: `sk_live_${Math.random().toString(36).substring(2, 18)}`,
                      lastUsed: new Date().toISOString(),
                      created: new Date().toISOString(),
                    };
                    setApiKeys([...apiKeys, newKey]);
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Generate New API Key
                </Button>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-300">
                    <strong>Security Note:</strong> Keep your API keys secure. Never share them publicly or commit them to version control.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* 2FA Backup Codes */}
      {settings.twoFactorEnabled && (
        <Card className="glass-card glass-card-hover border-amber-500/30">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Key className="w-8 h-8 text-amber-400" />
                <div>
                  <h3 className="text-xl font-bold text-slate-100">2FA Backup Codes</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Save these codes in a secure location. You'll need them if you lose access to your authenticator app.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                {showBackupCodes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {showBackupCodes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  {backupCodes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 font-mono text-center text-slate-200"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p className="mb-4">No backup codes generated yet</p>
                      <Button variant="defender" onClick={generateBackupCodes}>
                        Generate Backup Codes
                      </Button>
                    </div>
                  )}
                  {backupCodes.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const codesText = backupCodes.join('\n');
                          copyToClipboard(codesText);
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy All
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const codesText = backupCodes.join('\n');
                          const blob = new Blob([codesText], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = '2fa-backup-codes.txt';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-red-300">
                      <strong>Important:</strong> Backup codes are single-use. Generate new codes if you've used them all or if you suspect they've been compromised.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

