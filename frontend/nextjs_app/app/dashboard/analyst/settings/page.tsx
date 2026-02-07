'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SettingsSkeleton } from '@/components/analyst/settings/SettingsSkeleton';

export default function AnalystSettingsRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user?.uuid_id) {
        // Redirect to the correct analyst settings path
        router.replace(`/analyst/${user.uuid_id}/settings`);
      } else if (user) {
        // Fallback: try to use id if uuid_id is not available
        router.replace(`/analyst/${user.id}/settings`);
      } else {
        // User not authenticated, redirect to login
        router.replace('/login/analyst');
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while redirecting
  return <SettingsSkeleton />;
}

