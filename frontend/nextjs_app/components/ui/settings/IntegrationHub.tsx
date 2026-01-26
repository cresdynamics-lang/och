/**
 * Integration Hub Component
 * GitHub/THM/Coursera OAuth status and connections
 * Enhanced with sync status, last sync time, auto-import settings, and webhook management
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, ExternalLink, BookOpen, Link2, CheckCircle, XCircle, RefreshCw, Clock, Settings, ChevronDown, ChevronUp, Zap, Database, AlertCircle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Local types to replace missing @/lib/settings imports
export interface UserSettings {
  integrations?: Record<string, string>;
  [key: string]: any;
}

export interface SettingsUpdate {
  [key: string]: any;
}

interface IntegrationHubProps {
  settings: UserSettings;
  updateSettings: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function IntegrationHub({ settings, updateSettings, userId }: IntegrationHubProps) {
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);

  // Mock sync data - in production, fetch from API
  const getSyncData = (integrationId: string) => {
    const syncData: Record<string, any> = {
      github: {
        lastSync: '2024-01-15T10:30:00Z',
        itemsImported: 12,
        autoSync: true,
        syncFrequency: 'daily',
        webhookEnabled: true,
      },
      thm: {
        lastSync: '2024-01-14T15:45:00Z',
        itemsImported: 8,
        autoSync: true,
        syncFrequency: 'weekly',
        webhookEnabled: false,
      },
      linkedin: {
        lastSync: '2024-01-10T09:20:00Z',
        itemsImported: 1,
        autoSync: false,
        syncFrequency: 'manual',
        webhookEnabled: false,
      },
    };
    return syncData[integrationId] || null;
  };

  const integrations = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Auto-import repositories as portfolio items',
      status: settings.integrations?.github || 'disconnected',
      connectUrl: '/api/auth/github',
      color: 'slate',
    },
    {
      id: 'thm',
      name: 'TryHackMe',
      icon: ExternalLink,
      description: 'Import completed rooms and achievements',
      status: settings.integrations?.thm || 'disconnected',
      connectUrl: '/api/auth/tryhackme',
      color: 'emerald',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Link2,
      description: 'Connect profile for synchronization',
      status: settings.integrations?.linkedin || 'disconnected',
      connectUrl: '/api/auth/linkedin',
      color: 'blue',
    },
  ];

  const handleSync = async (integrationId: string) => {
    setSyncing({ ...syncing, [integrationId]: true });
    try {
      // Simulate sync - in production, call API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Update last sync time
      alert(`${integrations.find(i => i.id === integrationId)?.name} sync completed!`);
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing({ ...syncing, [integrationId]: false });
    }
  };

  const handleConnect = (integrationId: string, connectUrl: string) => {
    window.location.href = connectUrl;
  };

  const handleDisconnect = (integrationId: string) => {
    updateSettings({
      integrations: {
        ...settings.integrations,
        [integrationId]: 'disconnected',
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Link2 className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Integrations</h2>
              <p className="text-xs text-slate-500 mt-1">
                Connect external platforms to auto-import portfolio items
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              const isConnected = integration.status === 'connected';
              const syncData = isConnected ? getSyncData(integration.id) : null;
              const isExpanded = expandedIntegration === integration.id;
              const isSyncing = syncing[integration.id];

              return (
                <div
                  key={integration.id}
                  className={`rounded-lg border transition-all ${
                    isConnected
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Icon className={`w-6 h-6 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-200">{integration.name}</span>
                            {isConnected ? (
                              <Badge variant="steel" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not connected
                              </Badge>
                            )}
                            {isConnected && syncData?.webhookEnabled && (
                              <Badge variant="steel" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px]">
                                <Zap className="w-3 h-3 mr-1" />
                                Webhook
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{integration.description}</p>
                          {isConnected && syncData && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last sync: {new Date(syncData.lastSync).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                {syncData.itemsImported} items
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(integration.id)}
                              disabled={isSyncing}
                              className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                            >
                              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedIntegration(isExpanded ? null : integration.id)}
                              className="border-slate-500/50 text-slate-400 hover:bg-slate-500/10"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </>
                        )}
                        {isConnected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="defender"
                            size="sm"
                            onClick={() => handleConnect(integration.id, integration.connectUrl)}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Settings */}
                  <AnimatePresence>
                    {isConnected && isExpanded && syncData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-700 p-4 bg-slate-900/50"
                      >
                        <div className="space-y-4">
                          {/* Auto-Sync Settings */}
                          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <RefreshCw className="w-5 h-5 text-indigo-400" />
                              <div>
                                <div className="text-sm font-medium text-slate-200">Auto-Sync</div>
                                <div className="text-xs text-slate-500">
                                  Automatically import new items from {integration.name}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                // Toggle auto-sync
                                alert(`Auto-sync ${syncData.autoSync ? 'disabled' : 'enabled'}`);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                syncData.autoSync ? 'bg-emerald-500' : 'bg-slate-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  syncData.autoSync ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Sync Frequency */}
                          {syncData.autoSync && (
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Sync Frequency</label>
                              <select
                                value={syncData.syncFrequency}
                                onChange={(e) => {
                                  alert(`Sync frequency set to ${e.target.value}`);
                                }}
                                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-2 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                              >
                                <option value="manual">Manual Only</option>
                                <option value="hourly">Every Hour</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                              </select>
                            </div>
                          )}

                          {/* Webhook Status */}
                          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-indigo-400" />
                              <div>
                                <div className="text-sm font-medium text-slate-200">Webhook Integration</div>
                                <div className="text-xs text-slate-500">
                                  Real-time updates via webhook (instant sync)
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {syncData.webhookEnabled ? (
                                <Badge variant="steel" className="bg-emerald-500/20 text-emerald-400">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </div>
                          </div>

                          {/* Sync Statistics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="text-xs text-slate-500 mb-1">Items Imported</div>
                              <div className="text-lg font-bold text-slate-100">{syncData.itemsImported}</div>
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="text-xs text-slate-500 mb-1">Last Sync</div>
                              <div className="text-sm font-medium text-slate-200">
                                {new Date(syncData.lastSync).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Sync Now Button */}
                          <Button
                            variant="defender"
                            className="w-full"
                            onClick={() => handleSync(integration.id)}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <p className="text-xs text-slate-400">
              <strong className="text-indigo-300">How it works:</strong> Connected integrations automatically create portfolio items when you complete missions, push code, or earn certifications. Items are created as drafts and can be reviewed before publishing.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

