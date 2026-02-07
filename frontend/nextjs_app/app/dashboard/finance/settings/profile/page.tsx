'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';

export default function FinanceSettingsProfileRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user?.uuid_id) {
        // Redirect to the finance settings page (profile section is at the top)
        router.replace(`/finance/${user.uuid_id}/settings`);
      } else if (user?.id) {
        // Fallback: try to use id if uuid_id is not available
        router.replace(`/finance/${user.id}/settings`);
      } else {
        // User not authenticated, redirect to login
        router.replace('/login/finance');
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-och-midnight-black text-white flex items-center justify-center p-4">
      <Card className="p-8 bg-och-steel-grey/20 border border-och-steel-grey/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-cyber-mint mx-auto mb-4"></div>
          <p className="text-white/80">Redirecting to profile settings...</p>
        </div>
      </Card>
    </div>
  );
}

