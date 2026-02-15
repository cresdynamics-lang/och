'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserRoles } from '@/utils/rbac';
import { djangoClient } from '@/services/djangoClient';

const ROLES_REQUIRING_TWO_MFA = ['program_director', 'director', 'admin', 'finance', 'finance_admin', 'analyst', 'mentor'];
const MFA_CHECK_TIMEOUT_MS = 8000;
const MFA_COMPLIANT_KEY = 'mfa_compliant';

function userRequiresTwoMFA(roles: string[]): boolean {
  return roles.some((r) => ROLES_REQUIRING_TWO_MFA.includes(r));
}

function isAllowedPathWithoutTwoMFA(pathname: string): boolean {
  if (pathname === '/dashboard/mfa-required') return true;
  if (pathname.includes('/settings')) return true;
  if (pathname.includes('/profile')) return true;
  if (pathname.startsWith('/dashboard/finance')) return true;
  if (pathname.startsWith('/finance/') && pathname.includes('settings')) return true;
  if (pathname.startsWith('/analyst/') && pathname.includes('settings')) return true;
  return false;
}

interface MFARequiredGuardProps {
  children: React.ReactNode;
}

/**
 * For Director, Mentor, Admin, Finance: do NOT render dashboard until MFA is verified.
 * If user has fewer than 2 MFA methods, redirect to set-MFA page immediately (dashboard never renders).
 */
export function MFARequiredGuard({ children }: MFARequiredGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mfaCheckDone, setMfaCheckDone] = useState(false);
  const [hasEnoughMFA, setHasEnoughMFA] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) {
      setMfaCheckDone(false);
      return;
    }

    const roles = getUserRoles(user);
    if (!userRequiresTwoMFA(roles)) {
      setHasEnoughMFA(true);
      setMfaCheckDone(true);
      return;
    }

    if (isAllowedPathWithoutTwoMFA(pathname || '')) {
      setMfaCheckDone(true);
      setHasEnoughMFA(true);
      return;
    }

    // Skip API if login flow already verified 2+ MFA (avoids "Verifying security setup..." on dashboard)
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(MFA_COMPLIANT_KEY) === '1') {
      setMfaCheckDone(true);
      setHasEnoughMFA(true);
      return;
    }

    let cancelled = false;
    const timeoutPromise = new Promise<{ methods: never[] }>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), MFA_CHECK_TIMEOUT_MS)
    );
    const fetchPromise = djangoClient.auth.getMFAMethods();

    Promise.race([fetchPromise, timeoutPromise])
      .then((res) => {
        if (cancelled) return;
        const count = (res.methods || []).length;
        const enough = count >= 2;
        setHasEnoughMFA(enough);
        if (enough && typeof window !== 'undefined') {
          window.sessionStorage.setItem(MFA_COMPLIANT_KEY, '1');
        }
        if (!enough) {
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(MFA_COMPLIANT_KEY);
            window.location.replace('/dashboard/mfa-required');
          } else {
            router.replace('/dashboard/mfa-required');
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasEnoughMFA(false);
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(MFA_COMPLIANT_KEY);
            window.location.replace('/dashboard/mfa-required');
          } else {
            router.replace('/dashboard/mfa-required');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setMfaCheckDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAuthenticated, isLoading, pathname, router]);

  if (!mfaCheckDone || !hasEnoughMFA) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-och-mint border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-och-steel text-sm">Verifying security setup...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
