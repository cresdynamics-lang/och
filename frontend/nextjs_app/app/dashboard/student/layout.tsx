/**
 * Redesigned Student Layout
 * Implements the persistent Mission Control navigation with enhanced sidebar.
 */

'use client';

import { DashboardProviders } from './providers';
import { EnhancedSidebar } from './components/EnhancedSidebar';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useDashboardCoordination } from './lib/hooks/useDashboardCoordination';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { useKeyboardShortcuts } from './lib/hooks/useKeyboardShortcuts';
import { useFocusManagement } from './lib/hooks/useFocusManagement';
import { useDashboardStore } from './lib/store/dashboardStore';
import clsx from 'clsx';
import { useState } from 'react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  // Global dashboard behavior
  useKeyboardShortcuts();
  useFocusManagement();

  // Coordinated data fetching for sidebar and other components
  const { isLoading } = useDashboardCoordination();
  const { isSidebarCollapsed: isCollapsedFromStore = false } = useDashboardStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isCollapsedFromStore);

  return (
    <div className="min-h-screen bg-och-midnight flex flex-col lg:flex-row overflow-hidden text-slate-200">
      {/* Persistent Desktop Sidebar */}
      <div className={clsx(
        "hidden lg:flex lg:flex-col shrink-0 transition-all duration-300",
        sidebarCollapsed ? "w-[80px]" : "w-[280px]"
      )}>
        <ErrorBoundary>
          <EnhancedSidebar 
            isCollapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </ErrorBoundary>
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className={clsx(
            "w-full p-3 lg:p-6 pb-24 lg:pb-6 transition-all duration-300",
            sidebarCollapsed ? "max-w-none" : "max-w-[1600px] mx-auto"
          )}>
            <ErrorBoundary>
              {isLoading ? <DashboardSkeleton /> : children}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProviders>
      <LayoutContent>
        {children}
      </LayoutContent>
    </DashboardProviders>
  );
}
