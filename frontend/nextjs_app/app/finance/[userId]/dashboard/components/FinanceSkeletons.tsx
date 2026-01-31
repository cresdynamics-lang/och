import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";

// Revenue Hero Skeleton
export const RevenueHeroSkeleton = () => (
  <Card className="cyber-gradient text-white border-0 shadow-2xl">
    <CardContent className="p-8 pt-10 pb-12">
      <div className="animate-pulse">
        <div className="h-10 bg-white/20 rounded-lg mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-48 mb-8"></div>

        <div className="grid grid-cols-3 gap-6 text-sm mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-8 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-20"></div>
              <div className="h-3 bg-green-400/20 rounded w-12"></div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-10 pt-10 border-t border-white/10">
          <div className="flex-1 h-12 bg-white/10 rounded-lg animate-pulse"></div>
          <div className="flex-1 h-12 bg-white/5 border border-white/20 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Side Panel Skeleton
export const FinanceSidePanelSkeleton = () => (
  <Card className="h-44 border-slate-700/50 backdrop-blur-xl bg-gradient-to-b from-slate-800/60 to-slate-900/80">
    <CardHeader className="pb-3 pt-4 px-4">
      <div className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-600 rounded w-20"></div>
          <div className="h-5 bg-cyan-500/20 rounded w-12"></div>
        </div>
      </div>
    </CardHeader>

    <CardContent className="px-4 space-y-1.5 pb-1">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
      </div>
    </CardContent>

    <div className="px-4 pt-2 pb-3">
      <div className="animate-pulse">
        <div className="h-5 bg-cyan-500/20 rounded w-16"></div>
      </div>
    </div>
  </Card>
);

// Pipeline Chart Skeleton
export const PipelineChartSkeleton = () => (
  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
    <CardHeader>
      <div className="animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-32"></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-24 h-4 bg-slate-700 rounded"></div>
            <div className="flex-1 h-3 bg-slate-700 rounded-full"></div>
            <div className="w-16 h-4 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50 animate-pulse">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 bg-slate-700 rounded mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Sponsor Table Skeleton
export const SponsorTableSkeleton = () => (
  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
    <CardHeader>
      <div className="animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-32"></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
              <div>
                <div className="h-4 bg-slate-700 rounded w-16 mb-1"></div>
                <div className="h-3 bg-slate-700 rounded w-24"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-5 bg-slate-700 rounded w-20 mb-1"></div>
              <div className="h-3 bg-slate-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Placement Pipeline Skeleton
export const PlacementPipelineSkeleton = () => (
  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
    <CardHeader>
      <div className="animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-48"></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-6 bg-cyan-500/20 rounded w-12"></div>
              <div className="flex-1">
                <div className="h-5 bg-slate-700 rounded w-24 mb-1"></div>
                <div className="h-4 bg-slate-700 rounded w-32"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="h-5 bg-slate-700 rounded w-20 mb-1"></div>
                <div className="h-4 bg-slate-700 rounded w-16"></div>
              </div>
              <div className="h-8 bg-slate-700 rounded w-8"></div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Full Dashboard Skeleton
export const FinanceDashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20 p-4 md:p-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-5 xl:gap-6 h-[calc(100vh-2rem)]">
      {/* Side panels skeleton */}
      <div className="xl:col-span-1 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <FinanceSidePanelSkeleton key={i} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="xl:col-span-4 space-y-6">
        <RevenueHeroSkeleton />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <PipelineChartSkeleton />
          <SponsorTableSkeleton />
          <div className="lg:col-span-2 xl:col-span-3">
            <PlacementPipelineSkeleton />
          </div>
        </div>
      </div>
    </div>
  </div>
);
