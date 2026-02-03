'use client';

import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onTabSelect: (tab: string | null) => void;
  activeTab: string | null;
}

const tabs = [
  { id: 'lab', icon: '🔍', label: 'LAB' },
  { id: 'learning', icon: '📚', label: 'LEARN' },
  { id: 'metrics', icon: '📈', label: 'METRICS' },
  { id: 'career', icon: '🎯', label: 'CAREER' },
  { id: 'reports', icon: '📋', label: 'REPORTS' },
  { id: 'tools', icon: '⚙️', label: 'TOOLS' }
];

export const MobileBottomNav = ({ onTabSelect, activeTab }: MobileBottomNavProps) => {
  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId) {
      // If clicking the same tab, close overlay
      onTabSelect(null);
    } else {
      // Open overlay for clicked tab
      onTabSelect(tabId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(tabId);
    }

    // Arrow key navigation for mobile
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (newIndex !== currentIndex) {
      e.preventDefault();
      onTabSelect(tabs[newIndex].id);
      // Focus the new tab button
      const newTabButton = document.querySelector(`[data-mobile-tab="${tabs[newIndex].id}"]`) as HTMLElement;
      newTabButton?.focus();
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-och-midnight-black border-t border-och-steel-grey/50 p-2 grid grid-cols-6 gap-1 z-50"
      role="tablist"
      aria-label="Mobile analyst dashboard navigation"
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          data-mobile-tab={tab.id}
          onClick={() => handleTabClick(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, tab.id)}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-och-defender-blue/50",
            activeTab === tab.id
              ? "bg-och-defender-blue text-white shadow-lg"
              : "text-och-steel-grey hover:bg-och-steel-grey/20"
          )}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={activeTab === tab.id ? `mobile-panel-${tab.id}` : undefined}
          aria-label={`${tab.label} panel ${activeTab === tab.id ? '(active)' : ''}`}
          tabIndex={0}
        >
          <span className="text-lg mb-1" aria-hidden="true">{tab.icon}</span>
          <span className="text-xs font-medium uppercase tracking-wide">
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
};
