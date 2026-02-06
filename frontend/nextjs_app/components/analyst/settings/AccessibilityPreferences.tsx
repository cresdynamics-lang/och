'use client';

import { Switch } from '@/components/ui/Switch';
import { Eye, Headphones, Keyboard } from 'lucide-react';

interface AccessibilityPreferencesProps {
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    keyboardShortcuts: boolean;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const AccessibilityPreferences = ({ accessibility, userId, onUpdate }: AccessibilityPreferencesProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Eye className="w-5 h-5 text-och-defender-blue" />
        Accessibility Preferences
      </h4>

      {/* High Contrast */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">High Contrast</div>
            <div className="text-sm text-och-steel-grey">
              Increase contrast for better visibility
            </div>
          </div>
        </div>
        <Switch
          checked={accessibility.highContrast}
          onCheckedChange={(enabled) => onUpdate({ highContrast: enabled })}
        />
      </div>

      {/* Screen Reader */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Headphones className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">Screen Reader Optimization</div>
            <div className="text-sm text-och-steel-grey">
              Optimize UI for screen readers
            </div>
          </div>
        </div>
        <Switch
          checked={accessibility.screenReader}
          onCheckedChange={(enabled) => onUpdate({ screenReader: enabled })}
        />
      </div>

      {/* Keyboard Shortcuts */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Keyboard className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">Keyboard Shortcuts</div>
            <div className="text-sm text-och-steel-grey">
              Enable ⌘K command palette and shortcuts
            </div>
          </div>
        </div>
        <Switch
          checked={accessibility.keyboardShortcuts}
          onCheckedChange={(enabled) => onUpdate({ keyboardShortcuts: enabled })}
        />
      </div>

      {accessibility.keyboardShortcuts && (
        <div className="p-4 bg-och-defender-blue/10 border border-och-defender-blue/30 rounded-lg">
          <div className="text-sm font-medium mb-2">Keyboard Shortcuts Reference</div>
          <div className="text-xs text-och-steel-grey space-y-1">
            <div>⌘K - Open command palette</div>
            <div>⌘W - Wireshark Lab</div>
            <div>⌘Y - YARA Editor</div>
            <div>⌘S - Sigma IOC Hunter</div>
          </div>
        </div>
      )}
    </div>
  );
};

