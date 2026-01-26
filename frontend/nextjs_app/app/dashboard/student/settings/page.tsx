/**
 * Student Settings Page - Redirects to Overview by default
 * 
 * Managing your account as a student (mentee) in the OCH ecosystem is a continuous 
 * process of identity formation and professional development, moving beyond simple 
 * administrative maintenance. Your account serves as the primary data source for 
 * the TalentScope analytics engine, which quantifies your readiness for the 
 * cybersecurity marketplace.
 * 
 * Analogy: Managing your OCH account is like maintaining a digital pilot's logbook 
 * and passport. Your initial Profiling is your flight physical; your Subscription 
 * determines which aircraft (features) you can fly; and your Consent Settings are 
 * the security clearances you grant to different control towers (mentors and employers).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function SettingsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to overview by default
    router.replace('/dashboard/student/settings/overview');
  }, [router]);

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-midnight/95 to-och-defender/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-och-mint border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-och-steel">Redirecting to settings overview...</p>
        </div>
      </div>
    </RouteGuard>
  );
}

