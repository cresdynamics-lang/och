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
      if (user) {
        // Use id as string for the analyst settings path
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

