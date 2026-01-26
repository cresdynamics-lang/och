/**
 * System Status Rail Component
 * Live impact indicators for all settings changes
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { useState, useEffect } from 'react';

interface StatusMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  message: string;
  impact: string;
  timestamp: Date;
}

export function SystemStatusRail() {
  const { settings, entitlements, isUpdating } = useSettingsMaster();
  const [messages, setMessages] = useState<StatusMessage[]>([]);

  useEffect(() => {
    if (isUpdating) {
      const msg: StatusMessage = {
        id: Date.now().toString(),
        type: 'info',
        message: 'Updating settings...',
        impact: 'Platform synchronizing',
        timestamp: new Date(),
      };
      setMessages(prev => [msg, ...prev.slice(0, 2)]);
    }
  }, [isUpdating]);

  useEffect(() => {
    if (settings && entitlements) {
      // Check for profile optimization changes
      if (settings.profileCompleteness >= 80) {
        const msg: StatusMessage = {
          id: Date.now().toString(),
          type: 'success',
          message: 'Profile Optimized!',
          impact: 'Node integrity reaching peak performance',
          timestamp: new Date(),
        };
        setMessages(prev => {
          if (prev.some(m => m.message === 'Profile Optimized!')) return prev;
          return [msg, ...prev.slice(0, 2)];
        });
      }
    }
  }, [settings?.profileCompleteness]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`glass-card border-2 ${
              msg.type === 'success' ? 'border-emerald-500/50 bg-emerald-500/10' :
              msg.type === 'warning' ? 'border-amber-500/50 bg-amber-500/10' :
              'border-indigo-500/50 bg-indigo-500/10'
            }`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {msg.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                  {msg.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
                  {msg.type === 'info' && <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-100 text-sm mb-1">{msg.message}</div>
                    <div className="text-xs text-slate-400">{msg.impact}</div>
                  </div>
                  <button
                    onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

