'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface NotificationPrioritiesProps {
  priorities: {
    critical: Array<'mttr' | 'quiz-overdue'>;
    high: Array<'career-match' | 'portfolio-view'>;
    low: Array<'daily-streak' | 'video-recommended'>;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const NotificationPriorities = ({ priorities, userId, onUpdate }: NotificationPrioritiesProps) => {
  const togglePriority = async (level: 'critical' | 'high' | 'low', item: string) => {
    const current = priorities[level];
    const updated = current.includes(item as any)
      ? current.filter(i => i !== item)
      : [...current, item as any];
    
    await onUpdate({ ...priorities, [level]: updated });
  };

  const getItemLabel = (item: string) => {
    const labels: Record<string, string> = {
      'mttr': 'MTTR >30min',
      'quiz-overdue': 'Quiz Overdue',
      'career-match': 'Career Match >80%',
      'portfolio-view': 'Portfolio View',
      'daily-streak': 'Daily Streak',
      'video-recommended': 'Video Recommended',
    };
    return labels[item] || item;
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Notification Priorities</h4>
      
      {/* Critical */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">Critical</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['mttr', 'quiz-overdue'] as const).map((item) => (
            <button
              key={item}
              onClick={() => togglePriority('critical', item)}
              className={`px-3 py-1 rounded-lg border transition-all text-sm ${
                priorities.critical.includes(item)
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {getItemLabel(item)}
            </button>
          ))}
        </div>
      </div>

      {/* High */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-och-signal-orange" />
          <span className="text-sm font-medium text-och-signal-orange">High</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['career-match', 'portfolio-view'] as const).map((item) => (
            <button
              key={item}
              onClick={() => togglePriority('high', item)}
              className={`px-3 py-1 rounded-lg border transition-all text-sm ${
                priorities.high.includes(item)
                  ? 'border-och-signal-orange bg-och-signal-orange/20 text-och-signal-orange'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {getItemLabel(item)}
            </button>
          ))}
        </div>
      </div>

      {/* Low */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-och-steel-grey" />
          <span className="text-sm font-medium text-och-steel-grey">Low</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['daily-streak', 'video-recommended'] as const).map((item) => (
            <button
              key={item}
              onClick={() => togglePriority('low', item)}
              className={`px-3 py-1 rounded-lg border transition-all text-sm ${
                priorities.low.includes(item)
                  ? 'border-och-steel-grey bg-och-steel-grey/20 text-white'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {getItemLabel(item)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

