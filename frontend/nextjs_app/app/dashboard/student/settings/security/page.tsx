'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { OCHSettingsSecurity } from '@/components/ui/settings/sections/OCHSettingsSecurity';

export default function SettingsSecurityPage() {
  return (
    <RouteGuard>
      <OCHSettingsSecurity />
    </RouteGuard>
  );
}










