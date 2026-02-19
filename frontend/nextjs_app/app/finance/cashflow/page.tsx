"use client"

import { Suspense } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { useAuth } from '@/hooks/useAuth';
import { FinanceDashboardSkeleton } from "../dashboard/components";
import { RouteGuard } from '@/components/auth/RouteGuard';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function CashFlowContent() {
  const { user } = useAuth();
  const userId = user?.id || 'finance-user';

  const { data: revenueData } = useSWR(`/api/finance/${userId}/revenue`, fetcher);

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Cash Flow & Financial Health</h1>
      <Suspense fallback={<FinanceDashboardSkeleton />}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Current Balance</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.total ? Number(revenueData.total).toLocaleString() : '0'}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Monthly Burn Rate</p>
                <p className="text-2xl font-bold text-white">KES 450,000</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Runway</p>
                <p className="text-2xl font-bold text-white">18 months</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Next Payroll</p>
                <p className="text-2xl font-bold text-white">15 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}

export default function CashFlowPage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <CashFlowContent />
    </RouteGuard>
  );
}
