'use client';

import { Layout, BarChart3, Palette } from 'lucide-react';

interface DashboardPreferencesProps {
  dashboard: {
    layout: 'compact' | 'detailed';
    defaultTab: 'lab' | 'learning' | 'career' | 'metrics';
    theme: 'dark' | 'light';
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const DashboardPreferences = ({ dashboard, userId, onUpdate }: DashboardPreferencesProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Layout className="w-5 h-5 text-och-defender-blue" />
        Dashboard Preferences
      </h4>

      {/* Layout */}
      <div>
        <label className="block text-sm font-medium mb-2">Layout</label>
        <div className="flex gap-2">
          {(['compact', 'detailed'] as const).map((layout) => (
            <button
              key={layout}
              onClick={() => onUpdate({ layout })}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                dashboard.layout === layout
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      {/* Default Tab */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-och-steel-grey" />
          Default Tab
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['lab', 'learning', 'career', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onUpdate({ defaultTab: tab })}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                dashboard.defaultTab === tab
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <Palette className="w-4 h-4 text-och-steel-grey" />
          Theme
        </label>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => onUpdate({ theme })}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                dashboard.theme === theme
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

