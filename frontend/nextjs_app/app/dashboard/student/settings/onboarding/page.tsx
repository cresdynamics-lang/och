'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { OCHSettingsOnboarding } from '@/components/ui/settings/sections/OCHSettingsOnboarding';

export default function SettingsOnboardingPage() {
  return (
    <RouteGuard>
      <OCHSettingsOnboarding />
    </RouteGuard>
  );
}










