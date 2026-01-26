'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { OCHSettingsSubscription } from '@/components/ui/settings/sections/OCHSettingsSubscription';

export default function SettingsSubscriptionPage() {
  return (
    <RouteGuard>
      <OCHSettingsSubscription />
    </RouteGuard>
  );
}










