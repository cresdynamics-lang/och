'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserRoles } from '@/utils/rbac';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, Lock } from 'lucide-react';

const ROLES_REQUIRING_TWO_MFA = ['admin', 'program_director', 'director', 'mentor', 'finance', 'finance_admin', 'analyst', 'support'] as const;
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: 'Admin',
  program_director: 'Director',
  director: 'Director',
  mentor: 'Mentor',
  finance: 'Finance',
  finance_admin: 'Finance',
  analyst: 'Analyst',
  support: 'Support',
};

function getPrimaryMfaRoleDisplay(roles: string[]): string {
  for (const r of ROLES_REQUIRING_TWO_MFA) {
    if (roles.includes(r)) return ROLE_DISPLAY_NAMES[r] ?? r;
  }
  return 'Director';
}

const MFA_SETUP_HREF = '/dashboard/mfa-required/setup';

export default function MFARequiredPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const roles = user ? getUserRoles(user) : [];
  const roleDisplay = getPrimaryMfaRoleDisplay(roles);

  if (!isLoading && (!isAuthenticated || !user)) {
    router.replace('/login/student');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full bg-och-midnight/80 border border-och-steel/20 rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-och-gold/20 flex items-center justify-center border-2 border-och-gold/50">
            <Shield className="w-8 h-8 text-och-gold" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tight">
          Additional verification required
        </h1>
        <p className="text-och-steel text-center mb-6">
          Your role (<strong className="text-white">{roleDisplay}</strong>) requires at least <strong className="text-white">two</strong> multi-factor authentication methods before you can access the dashboard.
        </p>
        <p className="text-sm text-och-steel text-center mb-8">
          Set up at least two methods below (e.g. Authenticator app, SMS, or Email). You can add or remove methods there, but you must always have at least two to sign in.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="defender"
            className="flex items-center justify-center gap-2"
            onClick={() => router.push(MFA_SETUP_HREF)}
          >
            <Lock className="w-4 h-4" />
            Set up MFA
          </Button>
          <Button
            variant="outline"
            className="border-och-steel/30 text-och-steel"
            onClick={() => router.push('/login/student')}
          >
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
