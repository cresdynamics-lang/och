'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OCHSettingsSecurity } from '@/components/ui/settings/sections/OCHSettingsSecurity';
import { useAuth } from '@/hooks/useAuth';
import { djangoClient } from '@/services/djangoClient';

function MFASetupContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated } = useAuth();
  const mfaParam = searchParams.get('mfa');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/login/student');
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isLoading || !user || mfaParam) return;

    let cancelled = false;
    djangoClient.auth
      .getMFAMethods()
      .then((res: { methods?: unknown[] }) => {
        if (cancelled) return;
        const count = (res.methods || []).length;
        const query = count < 1 ? '?mfa=true' : '?mfa=manage';
        router.replace(pathname + query);
      })
      .catch(() => {
        if (!cancelled) router.replace(pathname + '?mfa=true');
      });

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, mfaParam, pathname, router]);

  if (!isLoading && (!isAuthenticated || !user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <Link
          href="/dashboard/mfa-required"
          className="inline-flex items-center gap-2 text-och-steel hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <OCHSettingsSecurity />
      </div>
    </div>
  );
}

export default function MFASetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-och-defender" />
      </div>
    }>
      <MFASetupContent />
    </Suspense>
  );
}
