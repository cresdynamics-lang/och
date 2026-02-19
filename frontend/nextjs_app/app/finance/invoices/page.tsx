"use client"

import { Suspense } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { useAuth } from '@/hooks/useAuth';
import { SponsorTable, ActionsDropdown, FinanceDashboardSkeleton } from "../dashboard/components";
import { RouteGuard } from '@/components/auth/RouteGuard';

function InvoicesContent() {
  const { user } = useAuth();
  const userId = user?.id || 'finance-user';

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
        <ActionsDropdown isActive={false} userId={userId} />
      </div>
      <Suspense fallback={<FinanceDashboardSkeleton />}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <SponsorTable userId={userId} />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <InvoicesContent />
    </RouteGuard>
  );
}
