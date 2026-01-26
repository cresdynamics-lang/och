'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { OCHSettingsPrivacy } from '@/components/ui/settings/sections/OCHSettingsPrivacy';

export default function SettingsPrivacyPage() {
  return (
    <RouteGuard>
      <OCHSettingsPrivacy />
    </RouteGuard>
  );
}










