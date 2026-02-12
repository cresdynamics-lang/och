"use client"

import { Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from '@/hooks/useAuth';
import { FinanceSidePanel } from "./components/FinanceSidePanel";
import { RevenueHero, PipelineChart, SponsorTable, PlacementPipeline, MobileBottomNav, FinanceDashboardSkeleton, ActionsDropdown } from "./components";
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Users, Target, Shield } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function FinanceDashboardContent() {
  const { userId } = useParams() as { userId: string };
  const { user, isLoading: authLoading } = useAuth();
  const [activeMobileTab, setActiveMobileTab] = useState('revenue');
  const [activePanel, setActivePanel] = useState('overview');
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch by ensuring consistent rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Always call hooks in the same order, regardless of early returns
  const { data: revenueData, error: revenueError } = useSWR(`/api/finance/${userId}/revenue`, fetcher, {
    refreshInterval: 30000, // 30s refresh
  });

  const { data: realtimeData, error: realtimeError } = useSWR(`/api/finance/${userId}/realtime`, fetcher, {
    refreshInterval: 3000, // 3s realtime updates
  });

  // Show loading during hydration or if authentication is still loading
  if (!isHydrated || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading OCH Finance Dashboard...</div>
      </div>
    );
  }

  const sidePanels = [
    {
      id: "overview",
      title: "Overview",
      action: "Dashboard →"
    },
    {
      id: "revenue",
      title: "Revenue",
      action: "Export →"
    },
    {
      id: "invoices",
      title: "Invoices",
      action: "Generate →"
    },
    {
      id: "placements",
      title: "Placements",
      action: "Tracker →"
    },
    {
      id: "subscriptions",
      title: "Pro7",
      action: "Alerts →"
    },
    {
      id: "cashflow",
      title: "Cash Flow",
      action: "Forecast →"
    },
    { id: "actions", title: "Actions", action: "dropdown" }
  ];

  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8 mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-och-defender" />
            <div>
              <h1 className="text-xl font-bold text-white">Ongoza CyberHub</h1>
              <p className="text-sm text-och-steel">
              Finance Dashboard • {revenueData?.scope === 'platform' ? 'Platform (All sponsors)' : 'SOC Analyst Operations'}
            </p>
            </div>
          </div>
          {revenueData && (
            <div className="hidden md:flex items-center gap-6 ml-8">
              <div className="flex items-center gap-2 text-sm text-och-steel">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live: KES {Number(revenueData.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-och-steel">
                <Users className="w-4 h-4" />
                <span>{Number(revenueData.activeUsers || 0)} Active Users</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-och-steel">
                <Target className="w-4 h-4" />
                <span>{Number(revenueData.placementsCount || 0)} Placements</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-5 xl:gap-6 h-[calc(100vh-8rem)]">

        {/* 🔥 SIDE PANELS: Fixed Navigation Buttons */}
        <div className="xl:col-span-1 xl:sticky xl:top-6 xl:self-start space-y-3 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto pr-0 xl:pr-6 scrollbar-thin scrollbar-cyan-500/20">
          {sidePanels.map(panel => (
            panel.id === 'actions' ? (
              <ActionsDropdown
                key={panel.id}
                isActive={activePanel === panel.id}
                userId={userId}
              />
            ) : (
              <FinanceSidePanel
                key={panel.id}
                id={panel.id}
                title={panel.title}
                action={panel.action}
                isActive={activePanel === panel.id}
                onClick={() => setActivePanel(panel.id)}
              />
            )
          ))}
        </div>

        {/* 🔥 MAIN: Dynamic Content Based on Active Panel */}
        <div className="xl:col-span-4 xl:max-h-full xl:overflow-y-auto scrollbar-thin scrollbar-cyan-500/20 space-y-6">
          <Suspense fallback={<FinanceDashboardSkeleton />}>
            {activePanel === 'overview' && revenueData && (
              <>
                  <RevenueHero revenue={{...revenueData, userId: userId}} realtime={realtimeData} showExportButtons={false} />
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <PipelineChart
                    activePlacements={Number(realtimeData?.metrics?.activePlacements || 0)}
                    conversionRate={Number(realtimeData?.metrics?.conversionRate || 0)}
                    monthlyRevenue={Number(realtimeData?.metrics?.monthlyRevenue || 0)}
                  />
                  <SponsorTable userId={userId} />
                  <div className="lg:col-span-2 xl:col-span-3">
                    <PlacementPipeline
                      activePlacements={Number(realtimeData?.metrics?.activePlacements || 0)}
                      totalValue={Number(revenueData?.placements || 0)}
                      averageSalary={
                        Number(realtimeData?.metrics?.activePlacements || 0) > 0
                          ? Number(revenueData?.placements || 0) /
                            Number(realtimeData?.metrics?.activePlacements || 1)
                          : 0
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {activePanel === 'revenue' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Detailed Revenue Analysis</h2>
                  {revenueData && (
                    <RevenueHero revenue={{...revenueData, userId: userId}} realtime={realtimeData} showExportButtons={true} />
                  )}
                  <div className="mt-8 text-slate-300">
                    <p>This section will contain detailed charts and tables for revenue breakdown, trends, and ROI analysis.</p>
                    <p>Current Revenue Data: KES {revenueData?.total ? Number(revenueData.total).toLocaleString() : 'Loading...'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activePanel === 'invoices' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Invoice Management</h2>
                  <SponsorTable userId={userId} />
                  <div className="mt-8 text-slate-300">
                    <p>This section will display a list of invoices, their status (due, paid, overdue), and options to generate new invoices or send reminders.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activePanel === 'placements' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Placement Pipeline</h2>
                  <PipelineChart />
                  <PlacementPipeline />
                  {/* Add more placement tracking components here */}
                  <div className="mt-8 text-slate-300">
                    <p>This section will show the detailed placement pipeline, active placements, and probability indicators.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activePanel === 'subscriptions' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Pro7 Subscription Management</h2>
                  {/* Add more subscription management components here */}
                  <div className="mt-8 text-slate-300">
                    <p>This section will provide metrics on active subscribers, MRR, churn rate, and upcoming renewals for Pro7 subscriptions.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activePanel === 'cashflow' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Cash Flow & Financial Health</h2>
                  {/* Add more cash flow components here */}
                  <div className="mt-8 text-slate-300">
                    <p>This section will display current cash balance, burn rate, runway calculations, and upcoming major expenses like payroll.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activePanel === 'actions' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Quick Actions & Workflows</h2>
                  <ActionsDropdown isActive={true} userId={userId} />
                  <div className="mt-8 text-slate-300">
                    <p>This panel provides a centralized place for all financial actions, including exports, report generation, and workflow triggers.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </Suspense>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabChange={setActiveMobileTab}
      />
    </div>
  );
}

export default function FinanceDashboard() {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20 p-4 md:p-6">
          <div className="max-w-7xl mx-auto xl:grid xl:grid-cols-5 xl:gap-6 h-[calc(100vh-2rem)] flex items-center justify-center">
            <div className="text-cyan-400 animate-pulse text-xl">Loading OCH Finance Dashboard...</div>
          </div>
        </div>
      }>
        <FinanceDashboardContent />
      </Suspense>
    </RouteGuard>
  );
}
