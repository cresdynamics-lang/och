'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { OCHSettingsOverview } from '@/components/ui/settings/sections/OCHSettingsOverview';

export default function SettingsOverviewPage() {
  return (
    <RouteGuard>
      <OCHSettingsOverview />
    </RouteGuard>
  );
}










