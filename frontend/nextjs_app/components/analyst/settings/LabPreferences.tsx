'use client';

import { Filter } from 'lucide-react';

interface LabPreferencesProps {
  lab: {
    defaultTool: 'siem' | 'wireshark' | 'yara' | 'sigma';
    alertFilters: Array<'ryuk' | 'phishing' | 'all'>;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const LabPreferences = ({ lab, userId, onUpdate }: LabPreferencesProps) => {
  const handleFilterToggle = async (filter: 'ryuk' | 'phishing' | 'all') => {
    if (filter === 'all') {
      await onUpdate({ alertFilters: ['all'] });
      return;
    }

    const current = lab.alertFilters.filter(f => f !== 'all');
    const updated = current.includes(filter)
      ? current.filter(f => f !== filter)
      : [...current, filter];
    
    await onUpdate({ alertFilters: updated.length === 0 ? ['all'] : updated });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Filter className="w-5 h-5 text-och-defender-blue" />
        Lab Preferences
      </h4>

      {/* Default Tool */}
      <div>
        <label className="block text-sm font-medium mb-2">Default Tool</label>
        <div className="grid grid-cols-2 gap-2">
          {(['siem', 'wireshark', 'yara', 'sigma'] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => onUpdate({ defaultTool: tool })}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                lab.defaultTool === tool
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Filters */}
      <div>
        <label className="block text-sm font-medium mb-2">Alert Filters</label>
        <div className="flex flex-wrap gap-2">
          {(['ryuk', 'phishing', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterToggle(filter)}
              className={`px-3 py-1 rounded-lg border transition-all capitalize text-sm ${
                lab.alertFilters.includes(filter)
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

