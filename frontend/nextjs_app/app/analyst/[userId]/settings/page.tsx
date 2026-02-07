'use client';

import { Suspense, useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { SettingsLayout } from '@/components/analyst/settings/SettingsLayout';
import { SettingsSkeleton } from '@/components/analyst/settings/SettingsSkeleton';
import { DashboardErrorBoundary } from '@/components/analyst/ErrorBoundary';
import { SkipNavigation } from '@/components/analyst/SkipNavigation';
import type { AnalystSettings } from '@/types/analyst-settings';

const VALID_TABS = ['account', 'profile', 'notifications', 'privacy', 'subscription', 'preferences'];

export default function AnalystSettingsPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<AnalystSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get initial tab from URL query param, default to 'account'
  const tabFromUrl = searchParams?.get('tab') || 'account';
  const initialTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'account';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Update tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab') || 'account';
    if (VALID_TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analyst/${resolvedParams.userId}/settings`);
        
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }

        const data = await response.json();
        setSettings(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [resolvedParams.userId]);

  const handleUpdate = async (section: string, updates: any) => {
    // Optimistic update
    const previousSettings = settings;
    const optimisticSettings = {
      ...settings!,
      [section]: {
        ...(settings as any)[section],
        ...updates,
      },
    };
    setSettings(optimisticSettings as AnalystSettings);

    try {
      const response = await fetch(`/api/analyst/${resolvedParams.userId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [section]: updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updated = await response.json();
      setSettings(updated);
    } catch (err: any) {
      // Revert on error
      setSettings(previousSettings);
      throw new Error(err.message || 'Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <>
        <SkipNavigation />
        <SettingsSkeleton />
      </>
    );
  }

  if (error || !settings) {
    return (
      <>
        <SkipNavigation />
        <div className="min-h-screen bg-och-midnight-black text-white flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-och-signal-orange mb-2">Settings Unavailable</h2>
            <p className="text-och-steel-grey mb-4">{error || 'Failed to load settings'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-och-defender-blue hover:bg-och-defender-blue/90 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SkipNavigation />
      <DashboardErrorBoundary>
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsLayout
            userId={resolvedParams.userId}
            settings={settings}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onUpdate={handleUpdate}
          />
        </Suspense>
      </DashboardErrorBoundary>
    </>
  );
}

