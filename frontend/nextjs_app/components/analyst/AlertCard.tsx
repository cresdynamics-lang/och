'use client';

import { Button } from '@/components/ui/Button';

export interface AnalystAlert {
  id: string;
  ioc: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  source: string;
  age: string;
  primaryAction: string;
  sigmaRule?: string;
  mitre?: string;
}

interface AlertCardProps {
  alert: AnalystAlert;
  onAction?: (action: string, alertId: string) => void;
}

export const AlertCard = ({ alert, onAction }: AlertCardProps) => {
  const handleAction = (action: string) => {
    onAction?.(action, alert.id);
  };

  return (
    <div className="group bg-och-steel-grey/50 hover:bg-och-defender-blue/10 p-4 rounded-xl border border-och-steel-grey/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-och-defender-blue/20">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <span className="font-mono text-sm text-och-cyber-mint">{alert.ioc}</span>
        </div>
        <span className="text-xs text-och-steel-grey px-2 py-1 bg-och-steel-grey/50 rounded font-medium">
          {alert.age}
        </span>
      </div>

      <div className="space-y-1 text-sm mb-3">
        <div className="font-medium text-white leading-tight">{alert.title}</div>
        <div className="text-och-steel-grey text-xs">{alert.source}</div>

        {alert.sigmaRule && (
          <div className="text-och-sahara-gold text-xs font-mono">
            Σ {alert.sigmaRule}
          </div>
        )}

        {alert.mitre && (
          <div className="text-och-cyber-mint text-xs">
            🎯 {alert.mitre}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="defender"
          className="flex-1 text-xs h-8 font-medium"
          onClick={() => handleAction(alert.primaryAction)}
        >
          {alert.primaryAction}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
          onClick={() => handleAction('CASE')}
        >
          CASE
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-xs text-och-steel-grey hover:text-white"
          onClick={() => handleAction('DISMISS')}
        >
          ✕
        </Button>
      </div>
    </div>
  );
};

// Lab-specific Severity Badge
const SeverityBadge = ({ severity }: { severity: 'critical' | 'high' | 'medium' }) => {
  const config = {
    critical: {
      color: 'bg-och-signal-orange text-white border-och-signal-orange',
      text: 'CRITICAL'
    },
    high: {
      color: 'bg-och-sahara-gold text-black border-och-sahara-gold',
      text: 'HIGH'
    },
    medium: {
      color: 'bg-och-defender-blue/20 text-och-defender-blue border-och-defender-blue/30',
      text: 'MEDIUM'
    }
  };

  const { color, text } = config[severity];

  return (
    <span
      className={`px-2 py-1 text-xs font-bold border rounded-full ${color}`}
      role="status"
      aria-label={`Alert severity: ${text}`}
    >
      {text}
    </span>
  );
};
