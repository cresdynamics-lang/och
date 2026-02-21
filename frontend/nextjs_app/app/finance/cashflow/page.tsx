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
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Streams & Net Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.total != null ? Number(revenueData.total).toLocaleString() : '0'}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Placements (revenue share)</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.placements != null ? Number(revenueData.placements).toLocaleString() : '0'}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Subscriptions</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.subscriptions != null ? Number(revenueData.subscriptions).toLocaleString() : '0'}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Cohort / Billing</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.cohort != null ? Number(revenueData.cohort).toLocaleString() : '0'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Expenses, refunds, and wallet activity are tracked via invoices and billing. Forecasts use active subscription and placement data.</p>
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
