"use client"

import { Suspense, useEffect, useState } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { useAuth } from '@/hooks/useAuth';
import { RevenueHero, PipelineChart, SponsorTable, PlacementPipeline, FinanceDashboardSkeleton } from "./components";
import { RouteGuard } from '@/components/auth/RouteGuard';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function FinanceDashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const userId = user?.id || 'finance-user';

  const { data: revenueData } = useSWR(`/api/finance/${userId}/revenue`, fetcher, {
    refreshInterval: 30000,
  });

  const { data: realtimeData } = useSWR(`/api/finance/${userId}/realtime`, fetcher, {
    refreshInterval: 3000,
  });

  if (!isHydrated || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading Finance Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Finance Dashboard</h1>
        <p className="text-sm text-slate-400">
          {revenueData?.scope === 'platform' ? 'Platform Overview • All Sponsors' : 'SOC Analyst Operations'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white">KES {Number(revenueData?.total || 0).toLocaleString()}</p>
            <p className="text-xs text-green-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Active Users</p>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white">{Number(revenueData?.activeUsers || 0)}</p>
            <p className="text-xs text-blue-500 mt-1">+5 new this week</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Placements</p>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-white">{Number(revenueData?.placementsCount || 0)}</p>
            <p className="text-xs text-purple-500 mt-1">+2 this month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Conversion Rate</p>
              <TrendingUp className="w-5 h-5 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-white">{Number(realtimeData?.metrics?.conversionRate || 0)}%</p>
            <p className="text-xs text-cyan-500 mt-1">Above target</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <Suspense fallback={<FinanceDashboardSkeleton />}>
          {revenueData && (
            <RevenueHero revenue={{...revenueData, userId: userId}} realtime={realtimeData} showExportButtons={false} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PipelineChart
              activePlacements={Number(realtimeData?.metrics?.activePlacements || 0)}
              conversionRate={Number(realtimeData?.metrics?.conversionRate || 0)}
              monthlyRevenue={Number(realtimeData?.metrics?.monthlyRevenue || 0)}
            />
            <SponsorTable userId={userId} />
          </div>
          <PlacementPipeline
            activePlacements={Number(realtimeData?.metrics?.activePlacements || 0)}
            totalValue={Number(revenueData?.placements || 0)}
            averageSalary={
              Number(realtimeData?.metrics?.activePlacements || 0) > 0
                ? Number(revenueData?.placements || 0) / Number(realtimeData?.metrics?.activePlacements || 1)
                : 0
            }
          />
        </Suspense>
      </div>
    </div>
  );
}

export default function FinanceDashboard() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20 flex items-center justify-center">
          <div className="text-cyan-400 animate-pulse text-xl">Loading Finance Dashboard...</div>
        </div>
      }>
        <FinanceDashboardContent />
      </Suspense>
    </RouteGuard>
  );
}
