'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Play, BookOpen, BarChart3, Briefcase, FileText, Settings } from 'lucide-react';
import { usePersist } from '@/hooks/usePersist';
import { LabPanel } from './LabPanel';
import { LearningPanel } from './LearningPanel';
import { MetricsPanel } from './MetricsPanel';
import { CareerPanel } from './CareerPanel';
import { ReportsPanel } from './ReportsPanel';
import { ToolsPanel } from './ToolsPanel';

interface SidePanelTabsProps {
  userId: string;
}

const SidePanelTabs = ({ userId }: SidePanelTabsProps) => {
  // Initialize active tab based on URL hash or persisted value
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      const validTabs = ['lab', 'learning', 'metrics', 'career', 'reports', 'tools']
      if (validTabs.includes(hash)) {
        return hash
      }
    }
    return 'lab'
  }

  const [activeTab, setActiveTab] = usePersist('analyst-tab', getInitialTab());

  // Listen for hash changes to update active tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      const validTabs = ['lab', 'learning', 'metrics', 'career', 'reports', 'tools']
      if (validTabs.includes(hash)) {
        setActiveTab(hash)
      }
    }

    // Set initial tab based on hash
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [setActiveTab])

  const tabs = [
    { id: 'lab', icon: Play, label: 'SIEM', component: <LabPanel userId={userId} /> },
    { id: 'learning', icon: BookOpen, label: 'LEARNING', component: <LearningPanel userId={userId} /> },
    { id: 'metrics', icon: BarChart3, label: 'METRICS', component: <MetricsPanel userId={userId} /> },
    { id: 'career', icon: Briefcase, label: 'CAREER', component: <CareerPanel userId={userId} /> },
    { id: 'reports', icon: FileText, label: 'REPORTS', component: <ReportsPanel userId={userId} /> },
    { id: 'tools', icon: Settings, label: 'TOOLS', component: <ToolsPanel userId={userId} /> }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabId);
    }

    // Arrow key navigation
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    let newIndex = currentIndex;

    if (e.key === 'ArrowDown') {
      newIndex = Math.min(currentIndex + 1, tabs.length - 1);
    } else if (e.key === 'ArrowUp') {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    if (newIndex !== currentIndex) {
      e.preventDefault();
      setActiveTab(tabs[newIndex].id);
      // Focus the new tab button
      const newTabButton = document.querySelector(`[data-tab-id="${tabs[newIndex].id}"]`) as HTMLElement;
      newTabButton?.focus();
    }
  };

  return (
    <div className="h-full flex flex-col text-sm" role="tabpanel">
      {/* Micro Tabs */}
      <nav
        className="flex-none p-2 border-b border-och-steel-grey/50 space-y-1"
        role="tablist"
        aria-label="Analyst dashboard navigation"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (typeof window !== 'undefined') {
                window.location.hash = tab.id
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={cn(
              "w-full p-2.5 rounded-lg text-left transition-all duration-150 border border-transparent hover:border-och-defender-blue/30",
              activeTab === tab.id && "bg-och-defender-blue/10 border-och-defender-blue text-och-defender-blue shadow-sm"
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            aria-label={`Switch to ${tab.label} panel`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <tab.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
              <span className="uppercase tracking-wider">{tab.label}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Compact Content */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-och-steel-grey/50 scrollbar-track-transparent scroll-smooth"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        id={`panel-${activeTab}`}
        aria-live="polite"
        style={{ scrollBehavior: 'smooth' }}
      >
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

// All panel components imported from separate files

export { SidePanelTabs };
