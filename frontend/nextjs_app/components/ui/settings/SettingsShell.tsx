/**
 * Settings Shell Component
 * Mission control dashboard wrapper for settings modules
 */

'use client';

import { motion } from 'framer-motion';
import { Settings, Shield, User, Bell, Command } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

interface SettingsShellProps {
  children: ReactNode;
}

export function SettingsShell({ children }: SettingsShellProps) {
  const { user } = useAuth();
  const userId = user?.id;

  return (
    <div className="min-h-screen bg-och-midnight">
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        {/* The main dashboard component handles its own header and grid */}
        {children}
      </div>
    </div>
  );
}
