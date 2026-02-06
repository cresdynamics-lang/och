'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Download, Database } from 'lucide-react';

interface GDPRSettingsProps {
  gdpr: {
    dataExport: {
      lastExport?: string;
      formats: Array<'json' | 'pdf'>;
    };
    analyticsOptOut: boolean;
    dataRetention: 'forever' | '2-years';
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const GDPRSettings = ({ gdpr, userId, onUpdate }: GDPRSettingsProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'pdf') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/analyst/${userId}/settings/privacy/export-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `och-data-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await onUpdate({
        dataExport: { ...gdpr.dataExport, lastExport: new Date().toISOString() }
      });
    } catch (error) {
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAnalyticsToggle = async (enabled: boolean) => {
    await onUpdate({ analyticsOptOut: !enabled });
  };

  const handleRetentionChange = async (retention: 'forever' | '2-years') => {
    await onUpdate({ dataRetention: retention });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Database className="w-5 h-5 text-och-defender-blue" />
        GDPR & Data Management
      </h4>

      {/* Data Export */}
      <div className="p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg space-y-3">
        <div>
          <div className="font-medium mb-2">Export Your Data</div>
          <div className="text-sm text-och-steel-grey mb-3">
            Download all your data in JSON or PDF format
          </div>
          {gdpr.dataExport.lastExport && (
            <div className="text-xs text-och-steel-grey mb-3">
              Last exported: {new Date(gdpr.dataExport.lastExport).toLocaleDateString()}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('json')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Opt-Out */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div>
          <div className="font-medium">Analytics Opt-Out</div>
          <div className="text-sm text-och-steel-grey mt-1">
            Stop sharing anonymized usage data (aggregates remain)
          </div>
        </div>
        <Switch
          checked={gdpr.analyticsOptOut}
          onCheckedChange={handleAnalyticsToggle}
        />
      </div>

      {/* Data Retention */}
      <div>
        <label className="block text-sm font-medium mb-2">Data Retention</label>
        <div className="space-y-2">
          {(['forever', '2-years'] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleRetentionChange(option)}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                gdpr.dataRetention === option
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              <div className="font-medium capitalize">
                {option === 'forever' ? 'Keep Forever' : 'Delete After 2 Years'}
              </div>
              <div className="text-xs mt-1">
                {option === 'forever'
                  ? 'Your data will be retained indefinitely'
                  : 'Your data will be automatically deleted after 2 years of inactivity'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

