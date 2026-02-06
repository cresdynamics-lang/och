'use client';

import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AlertCard, AnalystAlert } from './AlertCard';
import { ANALYST_ENDPOINTS } from '@/lib/analyst-api';

interface LabPanelProps {
  userId: string;
}

interface LabAlertsData {
  total: number;
  critical: number;
  high: number;
  criticalAlerts: AnalystAlert[];
}

export const LabPanel = ({ userId }: LabPanelProps) => {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AnalystAlert[]>([]);

  // Fetch lab alerts with 3-second refresh
  const { data: alertsData, error, isLoading } = useSWR<LabAlertsData>(
    `/api/analyst/${userId}/lab/alerts`,
    { refreshInterval: 3000 }
  );

  // Update alerts when data loads
  useEffect(() => {
    if (alertsData?.criticalAlerts) {
      setAlerts(alertsData.criticalAlerts);
    }
  }, [alertsData]);

  // SSE real-time updates for new alerts
  useEffect(() => {
    const eventSource = new EventSource(`/api/analyst/${userId}/lab/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_alert' && data.alert) {
          setAlerts(prev => [data.alert, ...prev].slice(0, 10)); // Keep max 10 alerts
        }
      } catch (error) {
        console.error('Error parsing lab SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Lab SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  const handleAlertAction = (action: string, alertId: string) => {
    console.log(`Lab action: ${action} for alert ${alertId}`);
    // TODO: Implement triage workflow, case creation, etc.
  };

  const handleStartNewLab = () => {
    console.log('Starting new lab session');
    router.push(`/analyst/${userId}/lab`);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-och-steel-grey/50">
        <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2">
          🔍 LAB
        </h3>

        {/* Alert Summary */}
        <div className="mt-3 space-y-1">
          <div className="text-sm text-white/80">
            Active Alerts: <span className="text-white font-bold">{alertsData?.total || 0}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-och-signal-orange rounded-full"></div>
              <span className="text-och-signal-orange font-bold">
                {alertsData?.critical || 0} Critical
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-och-sahara-gold rounded-full"></div>
              <span className="text-och-sahara-gold font-bold">
                {alertsData?.high || 0} High
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Alerts Feed */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 scrollbar-thin scrollbar-thumb-och-steel-grey/50 scrollbar-track-transparent">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="text-red-400 font-medium mb-2">Failed to load alerts</div>
            <div className="text-red-300 text-sm">Please try refreshing the page</div>
          </div>
        )}

        {isLoading && !alertsData && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-och-steel-grey/30 p-4 rounded-xl animate-pulse">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 bg-och-steel-grey/50 rounded w-20"></div>
                  <div className="h-4 bg-och-steel-grey/50 rounded w-12"></div>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="h-4 bg-och-steel-grey/50 rounded w-full"></div>
                  <div className="h-3 bg-och-steel-grey/50 rounded w-3/4"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-och-defender-blue/50 rounded flex-1"></div>
                  <div className="h-8 bg-och-steel-grey/50 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAction={handleAlertAction}
          />
        ))}

        {alerts.length === 0 && !isLoading && !error && (
          <div className="bg-och-steel-grey/30 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-white/80 font-medium mb-2">No Active Alerts</div>
            <div className="text-white/60 text-sm">All threats contained</div>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="p-4 border-t border-och-steel-grey/50 bg-och-steel-grey/30">
        <Button
          className="w-full bg-och-signal-orange hover:bg-och-signal-orange/90 text-white font-medium"
          onClick={handleStartNewLab}
        >
          START NEW LAB
        </Button>
      </div>
    </div>
  );
};
