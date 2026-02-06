'use client';

import { Switch } from '@/components/ui/Switch';
import { AlertTriangle, Clock, Save } from 'lucide-react';

interface WorkflowPreferencesProps {
  workflow: {
    alertUrgency: 'high' | 'all';
    mttrTarget: number;
    autoSave: {
      screenshots: boolean;
      notes: boolean;
    };
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const WorkflowPreferences = ({ workflow, userId, onUpdate }: WorkflowPreferencesProps) => {
  const mttrPresets = [20, 30];

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-och-defender-blue" />
        Workflow Preferences
      </h4>

      {/* Alert Urgency */}
      <div>
        <label className="block text-sm font-medium mb-2">Alert Urgency Filter</label>
        <div className="flex gap-2">
          {(['high', 'all'] as const).map((urgency) => (
            <button
              key={urgency}
              onClick={() => onUpdate({ alertUrgency: urgency })}
              className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                workflow.alertUrgency === urgency
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {urgency}
            </button>
          ))}
        </div>
      </div>

      {/* MTTR Target */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-och-steel-grey" />
          MTTR Target (minutes)
        </label>
        <div className="flex gap-2 mb-2">
          {mttrPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => onUpdate({ mttrTarget: preset })}
              className={`px-4 py-2 rounded-lg border transition-all ${
                workflow.mttrTarget === preset
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              {preset}min
            </button>
          ))}
        </div>
        <input
          type="number"
          value={workflow.mttrTarget}
          onChange={(e) => onUpdate({ mttrTarget: parseInt(e.target.value) || 30 })}
          min={10}
          max={60}
          className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
          placeholder="Custom (10-60)"
        />
      </div>

      {/* Auto-Save */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <Save className="w-4 h-4 text-och-steel-grey" />
          Auto-Save
        </label>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
            <span className="text-sm">Screenshots</span>
            <Switch
              checked={workflow.autoSave.screenshots}
              onCheckedChange={(enabled) => onUpdate({
                autoSave: { ...workflow.autoSave, screenshots: enabled }
              })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
            <span className="text-sm">Notes</span>
            <Switch
              checked={workflow.autoSave.notes}
              onCheckedChange={(enabled) => onUpdate({
                autoSave: { ...workflow.autoSave, notes: enabled }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

