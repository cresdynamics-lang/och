"use client"

import { Suspense, useState, useEffect } from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from '@/hooks/useAuth';
import { FinanceSidePanel } from "./components/FinanceSidePanel";
import { RevenueHero, PipelineChart, SponsorTable, PlacementPipeline, MobileBottomNav, FinanceDashboardSkeleton, ActionsDropdown } from "./components";
import { RouteGuard } from '@/components/auth/RouteGuard';
import { DashboardHeader } from '@/components/navigation/DashboardHeader';
import { DollarSign, TrendingUp, Users, CreditCard, FileText, Target, Crown, Wallet, Zap, Calendar, Shield } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function FinanceDashboardContent({ params }: { params: { userId: string } }) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeMobileTab, setActiveMobileTab] = useState('revenue');
  const [activePanel, setActivePanel] = useState('overview');
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch by ensuring consistent rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Always call hooks in the same order, regardless of early returns
  const { data: revenueData, error: revenueError } = useSWR(`/api/finance/${params.userId}/revenue`, fetcher, {
    refreshInterval: 30000, // 30s refresh
    fallbackData: {
      total: 4970000,
      cohort: 3200000,
      placements: 600000,
      pro7: 1270000,
      roi: 4.2,
      activeUsers: 127,
      placementsCount: 12,
      userId: params.userId
    }
  });

  const { data: realtimeData, error: realtimeError } = useSWR(`/api/finance/${params.userId}/realtime`, fetcher, {
    refreshInterval: 3000, // 3s realtime updates
    fallbackData: {
      liveUsers: 5,
      newInvoices: 2,
      recentPayments: 3
    }
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
      metrics: [
        "KES 4.97M Total",
        "127 Active Users",
        "12 Placements",
        "4.2x ROI"
      ],
      action: "Dashboard →"
    },
    {
      id: "revenue",
      title: "Revenue",
      metrics: [
        "KES 3.2M Cohort",
        "KES 1.27M Pro7",
        "KES 600K Fees",
        "4.2x ROI"
      ],
      action: "Export →"
    },
    {
      id: "invoices",
      title: "Invoices",
      metrics: [
        "MTN 500K Due",
        "Vodacom 300K ✓",
        "Ecobank 200K",
        "Q1: 1.2M"
      ],
      action: "Generate →"
    },
    {
      id: "placements",
      title: "Placements",
      metrics: [
        "12/127 (9%)",
        "KES 50K avg",
        "47 apps",
        "300K pending"
      ],
      action: "Tracker →"
    },
    {
      id: "subscriptions",
      title: "Pro7",
      metrics: [
        "127 active",
        "KES 1.27M MRR",
        "0% churn",
        "Feb 5 renew"
      ],
      action: "Alerts →"
    },
    {
      id: "cashflow",
      title: "Cash Flow",
      metrics: [
        "KES 2.1M",
        "150K/mo burn",
        "14mo runway",
        "Payroll Feb 5"
      ],
      action: "Forecast →"
    },
    { id: "actions", title: "Actions", action: "dropdown" }
  ];

  const mockRevenue = {
    total: 4970000,
    cohort: 3200000,
    placements: 600000,
    pro7: 1270000,
    roi: 4.2,
    activeUsers: 127,
    placementsCount: 12,
    userId: params.userId
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20">
      {/* OCH Finance Dashboard Header */}
      <div className="bg-och-midnight/95 backdrop-blur-sm border-b border-och-steel/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-och-defender" />
                <div>
                  <h1 className="text-xl font-bold text-white">Ongoza CyberHub</h1>
                  <p className="text-sm text-och-steel">Finance Dashboard • SOC Analyst Operations</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6 ml-8">
                <div className="flex items-center gap-2 text-sm text-och-steel">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live: KES {mockRevenue.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-och-steel">
                  <Users className="w-4 h-4" />
                  <span>{mockRevenue.activeUsers} Active Users</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-och-steel">
                  <Target className="w-4 h-4" />
                  <span>{mockRevenue.placementsCount} Placements</span>
                </div>
              </div>
            </div>
            <DashboardHeader />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto xl:grid xl:grid-cols-5 xl:gap-6 h-[calc(100vh-8rem)] p-4 md:p-6">

        {/* 🔥 SIDE PANELS: Fixed Navigation Buttons */}
        <div className="xl:col-span-1 xl:sticky xl:top-6 xl:self-start space-y-3 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto pr-0 xl:pr-6 scrollbar-thin scrollbar-cyan-500/20">
          {sidePanels.map(panel => (
            panel.id === 'actions' ? (
              <ActionsDropdown
                key={panel.id}
                isActive={activePanel === panel.id}
                userId={params.userId}
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
            {activePanel === 'overview' && (
              <>
                <RevenueHero revenue={{...revenueData, userId: params.userId}} realtime={realtimeData} showExportButtons={false} />
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <PipelineChart />
                  <SponsorTable />
                  <div className="lg:col-span-2 xl:col-span-3">
                    <PlacementPipeline />
                  </div>
                </div>
              </>
            )}

            {activePanel === 'revenue' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Detailed Revenue Analysis</h2>
                  <RevenueHero revenue={{...revenueData, userId: params.userId}} realtime={realtimeData} showExportButtons={true} />
                  {/* Add more detailed revenue components here */}
                  <div className="mt-8 text-slate-300">
                    <p>This section will contain detailed charts and tables for revenue breakdown, trends, and ROI analysis.</p>
                    <p>Current Revenue Data: KES {revenueData?.total?.toLocaleString() || 'Loading...'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activePanel === 'invoices' && (
              <Card className="cyber-gradient text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Invoice Management</h2>
                  <SponsorTable />
                  {/* Add more invoice management components here */}
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
                  <ActionsDropdown isActive={true} userId={params.userId} />
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

export default function FinanceDashboard({ params }: { params: { userId: string } }) {
  return (
    <RouteGuard requiredRoles={['finance']}>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20 p-4 md:p-6">
          <div className="max-w-7xl mx-auto xl:grid xl:grid-cols-5 xl:gap-6 h-[calc(100vh-2rem)] flex items-center justify-center">
            <div className="text-cyan-400 animate-pulse text-xl">Loading OCH Finance Dashboard...</div>
          </div>
        </div>
      }>
        <FinanceDashboardContent params={params} />
      </Suspense>
    </RouteGuard>
  );
}
