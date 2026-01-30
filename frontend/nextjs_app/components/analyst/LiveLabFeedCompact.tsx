'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Activity, Clock } from 'lucide-react';

interface LiveLabFeedCompactProps {
  userId: string;
}

interface IOCAlert {
  id: string;
  timestamp: string;
  ioc: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

export const LiveLabFeedCompact = ({ userId }: LiveLabFeedCompactProps) => {
  const { data: alerts, error, isLoading } = useSWR(
    `/api/analyst/${userId}/lab/feed`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return (
      <section className="space-y-2">
        <div className="h-6 bg-och-steel-grey/30 rounded animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-32 bg-och-steel-grey/30 rounded-xl animate-pulse"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-2">
        <div className="text-sm font-semibold text-och-cyber-mint mb-2">
          LIVE LAB FEED
        </div>
        <div className="h-32 bg-red-400/10 border border-red-400/30 rounded-xl p-3 flex items-center">
          <div className="text-xs text-red-300">Failed to load lab feed</div>
        </div>
      </section>
    );
  }

  const mockAlerts: IOCAlert[] = [
    { id: '1', timestamp: '2m ago', ioc: '192.168.4.17', type: 'IP', severity: 'critical', source: 'Firewall' },
    { id: '2', timestamp: '5m ago', ioc: 'ryuk.exe', type: 'File', severity: 'high', source: 'Endpoint' },
    { id: '3', timestamp: '8m ago', ioc: 'malware.ltd', type: 'Domain', severity: 'medium', source: 'DNS' }
  ];

  const displayAlerts = alerts || mockAlerts;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-semibold text-base tracking-tight text-och-cyber-mint uppercase">
          LIVE LAB FEED
        </h2>
        <div className={`w-2 h-2 rounded-full bg-och-cyber-mint animate-pulse`} />
      </div>

      <div className="bg-och-steel-grey/20 rounded-xl p-3 border border-och-steel-grey/30">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {displayAlerts.slice(0, 5).map((alert) => (
            <IOCAlertCompact key={alert.id} alert={alert} />
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-och-steel-grey/30">
          <div className="flex items-center justify-between text-xs">
            <div className="text-och-steel-grey">
              Total: <span className="font-mono text-och-cyber-mint">{displayAlerts.length}</span>
            </div>
            <div className="text-och-steel-grey">
              Critical: <span className="font-mono text-och-signal-orange">
                {displayAlerts.filter(a => a.severity === 'critical').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface IOCAlertCompactProps {
  alert: IOCAlert;
}

const IOCAlertCompact = ({ alert }: IOCAlertCompactProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-och-signal-orange/50 bg-och-signal-orange/10';
      case 'high':
        return 'border-och-sahara-gold/50 bg-och-sahara-gold/10';
      case 'medium':
        return 'border-och-cyber-mint/50 bg-och-cyber-mint/10';
      default:
        return 'border-och-steel-grey/50 bg-och-steel-grey/10';
    }
  };

  return (
    <div className={`border rounded-lg p-2 transition-all ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Badge className={`text-xs px-1.5 py-0.5 ${getSeverityColor(alert.severity)}`}>
            {alert.type}
          </Badge>
          <span className="font-mono text-xs font-medium text-white">
            {alert.ioc}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-och-steel-grey">
          <Clock className="w-3 h-3" />
          {alert.timestamp}
        </div>
      </div>

      <div className="text-xs text-och-steel-grey">
        {alert.source}
      </div>
    </div>
  );
};
