/**
 * Settings Page
 * Master control center
 */
'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { SettingsMasterDashboard } from '@/components/ui/settings/SettingsMasterDashboard';

function SettingsPageInner() {
  return <SettingsMasterDashboard />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-och-steel">Loading settings…</div>}>
      <SettingsPageInner />
    </Suspense>
  );
}

