'use client';

import { Suspense, useState, useEffect } from 'react';
import { SidePanelTabs } from '@/components/analyst/SidePanelTabs';
import { PriorityTasksCompact } from '@/components/analyst/PriorityTasksCompact';
import { LiveLabFeedCompact } from '@/components/analyst/LiveLabFeedCompact';
import { ProgressShelfMicro } from '@/components/analyst/ProgressShelfMicro';
import { MobileBottomNav } from '@/components/analyst/MobileBottomNav';
import { DashboardErrorBoundary } from '@/components/analyst/ErrorBoundary';
import { SkipNavigation } from '@/components/analyst/SkipNavigation';
import { useAnalystRealtime } from '@/hooks/useAnalystRealtime';

export default function AnalystDashboard({ params }: { params: { userId: string } }) {
  const [mobileOverlay, setMobileOverlay] = useState<string | null>(null);
  
  // Initialize realtime SSE updates
  useAnalystRealtime(params.userId);

  return (
    <>
      <SkipNavigation />

      {/* DESKTOP LAYOUT */}
      <div
        className="hidden md:block analyst-workstation min-h-screen bg-och-midnight-black text-white grid grid-cols-[280px_1fr] grid-rows-[1fr_auto] gap-0 h-screen overflow-hidden"
        role="main"
        aria-label="Analyst Dashboard"
      >
        {/* SIDE PANEL - 300px - 6 Tabs */}
        <aside
          className="sidebar bg-och-steel-grey col-span-1 row-span-2 overflow-hidden"
          role="complementary"
          aria-label="Navigation Panel"
          id="sidebar"
        >
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="p-4 text-och-steel-grey" aria-live="polite">Loading sidebar...</div>}>
              <SidePanelTabs userId={params.userId} />
            </Suspense>
          </DashboardErrorBoundary>
        </aside>

        {/* MAIN CONTENT - 50/50 Split */}
        <main
          className="main col-span-1 p-4 grid grid-cols-2 gap-4 overflow-y-auto"
          role="main"
          data-main-content
          tabIndex={-1}
          aria-label="Main dashboard content"
        >
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="animate-pulse"><div className="h-32 bg-och-steel-grey/30 rounded-xl"></div></div>}>
              <PriorityTasksCompact userId={params.userId} />
            </Suspense>
          </DashboardErrorBoundary>

          <DashboardErrorBoundary>
            <Suspense fallback={<div className="animate-pulse"><div className="h-32 bg-och-steel-grey/30 rounded-xl"></div></div>}>
              <LiveLabFeedCompact userId={params.userId} />
            </Suspense>
          </DashboardErrorBoundary>
        </main>

        {/* MICRO PROGRESS SHELF - 32px height */}
        <footer
          className="progress-shelf bg-och-steel-grey/80 border-t border-och-defender-blue/30 p-3 grid grid-cols-3 gap-3 text-xs"
          role="contentinfo"
          aria-label="Progress Metrics"
        >
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="animate-pulse"><div className="h-4 bg-och-steel-grey/30 rounded"></div></div>}>
              <ProgressShelfMicro userId={params.userId} />
            </Suspense>
          </DashboardErrorBoundary>
        </footer>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden min-h-screen bg-och-midnight-black text-white" role="application" aria-label="Mobile Analyst Dashboard">
        {/* Mobile Main Content */}
        <main className="pb-20 p-4 overflow-y-auto" role="main">
          {!mobileOverlay && (
            <div className="grid grid-cols-1 gap-6">
              <DashboardErrorBoundary>
                <Suspense fallback={<div className="text-och-steel-grey" aria-live="polite">Loading priorities...</div>}>
                  <PriorityTasksCompact userId={params.userId} />
                </Suspense>
              </DashboardErrorBoundary>

              <DashboardErrorBoundary>
                <Suspense fallback={<div className="text-och-steel-grey" aria-live="polite">Loading lab feed...</div>}>
                  <LiveLabFeedCompact userId={params.userId} />
                </Suspense>
              </DashboardErrorBoundary>
            </div>
          )}

          {/* Mobile Overlay Content */}
          {mobileOverlay && (
            <div
              className="fixed inset-0 bg-och-midnight-black z-40 p-4 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`mobile-${mobileOverlay}-title`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  id={`mobile-${mobileOverlay}-title`}
                  className="text-xl font-bold text-och-defender-blue"
                >
                  {mobileOverlay.toUpperCase()}
                </h2>
                <button
                  onClick={() => setMobileOverlay(null)}
                  className="text-och-steel-grey hover:text-white p-2"
                  aria-label="Close overlay"
                >
                  ✕
                </button>
              </div>

              {/* Render appropriate component based on overlay */}
              <div className="space-y-4">
                <DashboardErrorBoundary>
                  {mobileOverlay === 'lab' && <LabOverlay userId={params.userId} />}
                  {mobileOverlay === 'learning' && <LearningOverlay userId={params.userId} />}
                  {mobileOverlay === 'metrics' && <MetricsOverlay userId={params.userId} />}
                  {mobileOverlay === 'career' && <CareerOverlay userId={params.userId} />}
                  {mobileOverlay === 'reports' && <ReportsOverlay userId={params.userId} />}
                  {mobileOverlay === 'tools' && <ToolsOverlay />}
                </DashboardErrorBoundary>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <DashboardErrorBoundary>
          <MobileBottomNav onTabSelect={setMobileOverlay} activeTab={mobileOverlay} />
        </DashboardErrorBoundary>

        {/* Mobile Progress Shelf */}
        <footer
          className="fixed bottom-16 left-0 right-0 bg-och-steel-grey/80 border-t border-och-defender-blue/30 p-3 grid grid-cols-3 gap-3 text-xs"
          role="contentinfo"
          aria-label="Progress Metrics"
        >
          <DashboardErrorBoundary>
            <Suspense fallback={<div className="animate-pulse"><div className="h-4 bg-och-steel-grey/30 rounded"></div></div>}>
              <ProgressShelfMicro userId={params.userId} />
            </Suspense>
          </DashboardErrorBoundary>
        </footer>
      </div>
    </>
  );
}

// Mobile Overlay Components
const LabOverlay = ({ userId }: { userId: string }) => (
  <div className="space-y-4">
    <div className="p-4 bg-och-steel-grey/30 rounded-lg">
      <div className="text-lg font-medium">Active Labs</div>
      <div className="text-3xl font-bold text-och-cyber-mint">3</div>
    </div>
    <div className="p-4 bg-och-steel-grey/30 rounded-lg">
      <div className="text-lg font-medium">Current Scenario</div>
      <div className="text-lg text-och-sahara-gold">Ransomware Investigation</div>
    </div>
  </div>
);

const LearningOverlay = ({ userId }: { userId: string }) => (
  <div className="space-y-4">
    <div className="p-4 bg-och-steel-grey/30 rounded-lg">
      <div className="text-lg font-medium">Current Module</div>
      <div className="text-lg text-och-cyber-mint">Advanced Threat Hunting</div>
      <div className="w-full bg-och-steel-grey/50 rounded-full h-3 mt-2">
        <div className="bg-och-defender-blue h-3 rounded-full" style={{ width: '75%' }}></div>
      </div>
    </div>
    <div className="p-4 bg-och-steel-grey/30 rounded-lg">
      <div className="text-lg font-medium">Next Quiz</div>
      <div className="text-lg text-och-signal-orange">IOC Analysis - Due Today</div>
    </div>
  </div>
);

const MetricsOverlay = ({ userId }: { userId: string }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-och-steel-grey/30 rounded-lg text-center">
        <div className="text-2xl font-bold text-och-cyber-mint">96.2%</div>
        <div className="text-sm text-och-steel-grey">Detection Rate</div>
      </div>
      <div className="p-4 bg-och-steel-grey/30 rounded-lg text-center">
        <div className="text-2xl font-bold text-och-signal-orange">2.1%</div>
        <div className="text-sm text-och-steel-grey">False Positives</div>
      </div>
    </div>
  </div>
);

const CareerOverlay = ({ userId }: { userId: string }) => (
  <div className="space-y-4">
    <div className="p-4 bg-och-steel-grey/30 rounded-lg">
      <div className="text-lg font-medium">Current Level</div>
      <div className="text-2xl font-bold text-och-cyber-mint">L1 Analyst</div>
    </div>
    <div className="p-4 bg-och-steel-grey/30 rounded-lg">
      <div className="text-lg font-medium">Career Match</div>
      <div className="text-2xl font-bold text-och-sahara-gold">92%</div>
    </div>
  </div>
);

const ReportsOverlay = ({ userId }: { userId: string }) => (
  <div className="space-y-4">
    <button className="w-full p-4 bg-och-steel-grey/30 hover:bg-och-steel-grey/50 rounded-lg text-left transition-all">
      <div className="text-lg font-medium">Weekly Activity Report</div>
      <div className="text-sm text-och-steel-grey">Generated 2 hours ago</div>
    </button>
    <button className="w-full p-4 bg-och-steel-grey/30 hover:bg-och-steel-grey/50 rounded-lg text-left transition-all">
      <div className="text-lg font-medium">Performance Metrics</div>
      <div className="text-sm text-och-steel-grey">Generated yesterday</div>
    </button>
  </div>
);

const ToolsOverlay = () => (
  <div className="space-y-4">
    <button className="w-full p-4 bg-och-steel-grey/30 hover:bg-och-defender-blue/20 rounded-lg text-left transition-all">
      <div className="text-lg font-medium">IOC Scanner</div>
      <div className="text-sm text-och-cyber-mint">Online</div>
    </button>
    <button className="w-full p-4 bg-och-steel-grey/30 hover:bg-och-defender-blue/20 rounded-lg text-left transition-all">
      <div className="text-lg font-medium">Threat Intelligence</div>
      <div className="text-sm text-och-cyber-mint">Connected</div>
    </button>
  </div>
);
