"use client"

import { Suspense, useState } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { useAuth } from '@/hooks/useAuth';
import { RevenueHero, FinanceDashboardSkeleton } from "../dashboard/components";
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Users, DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function RevenueContent() {
  const { user } = useAuth();
  const userId = user?.id || 'finance-user';
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const revenueUrl = startDate && endDate 
    ? `/api/finance/${userId}/revenue?start=${startDate}&end=${endDate}`
    : `/api/finance/${userId}/revenue`;

  const { data: revenueData } = useSWR(revenueUrl, fetcher, {
    refreshInterval: 30000,
  });

  const { data: realtimeData } = useSWR(`/api/finance/${userId}/realtime`, fetcher, {
    refreshInterval: 3000,
  });

  const { data: subscriptionsData } = useSWR(`/api/finance/${userId}/subscriptions`, fetcher);
  const plans = subscriptionsData?.plans || [];

  const totalSubscriptionRevenue = plans.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
  const totalSubscribers = plans.reduce((sum: number, p: any) => sum + (p.users || 0), 0);

  const handleDownloadReport = async () => {
    const dateRange = startDate && endDate ? `${startDate}_to_${endDate}` : 'all_time';
    try {
      const response = await fetch(`/api/finance/${userId}/export/csv?start=${startDate}&end=${endDate}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue_report_${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download report');
    }
  };

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Revenue Analysis</h1>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>
      
      <Suspense fallback={<FinanceDashboardSkeleton />}>
        {revenueData && (
          <RevenueHero revenue={{...revenueData, userId}} realtime={realtimeData} showExportButtons={true} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Subscription Revenue</p>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">KES {totalSubscriptionRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-1">From all plans</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Total Subscribers</p>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-white">{totalSubscribers}</p>
              <p className="text-xs text-blue-500 mt-1">Active users</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Avg Revenue/User</p>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-white">
                KES {totalSubscribers > 0 ? Math.round(totalSubscriptionRevenue / totalSubscribers).toLocaleString() : '0'}
              </p>
              <p className="text-xs text-purple-500 mt-1">Per subscriber</p>
            </CardContent>
          </Card>
        </div>

        {plans.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Subscription Plans Breakdown</h3>
              <div className="space-y-4">
                {plans.map((plan: any, index: number) => {
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={plan.id} className="p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          <div>
                            <p className="text-white font-medium">{plan.name}</p>
                            <p className="text-sm text-slate-400">{plan.users || 0} subscribers</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">KES {(plan.revenue || 0).toLocaleString()}</p>
                          <p className="text-sm text-slate-400">
                            KES {plan.users > 0 ? Math.round(plan.revenue / plan.users).toLocaleString() : '0'}/user
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${totalSubscriptionRevenue > 0 ? (plan.revenue / totalSubscriptionRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800/50 border-slate-700 mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Total Revenue Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.total ? Number(revenueData.total).toLocaleString() : '0'}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Placements</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.placements ? Number(revenueData.placements).toLocaleString() : '0'}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Subscriptions</p>
                <p className="text-2xl font-bold text-white">KES {revenueData?.subscriptions ? Number(revenueData.subscriptions).toLocaleString() : '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}

export default function RevenuePage() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <RevenueContent />
    </RouteGuard>
  );
}
