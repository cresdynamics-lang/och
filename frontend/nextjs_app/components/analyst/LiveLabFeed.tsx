'use client';

import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { SeverityBadge } from './shared';
import { ANALYST_ENDPOINTS, LabAlert } from '@/lib/analyst-api';

interface LiveLabFeedProps {
  userId: string;
}

export const LiveLabFeed = ({ userId }: LiveLabFeedProps) => {
  const [alerts, setAlerts] = useState<LabAlert[]>([]);

  const { data: initialAlerts, error, isLoading } = useSWR(ANALYST_ENDPOINTS.labFeed(userId));

  // Update alerts when data loads
  useEffect(() => {
    if (initialAlerts) {
      setAlerts(initialAlerts);
    }
  }, [initialAlerts]);

  // Screen reader announcement for new alerts
  const [announcement, setAnnouncement] = useState('');

  // Real-time SSE updates
  useEffect(() => {
    const eventSource = new EventSource(ANALYST_ENDPOINTS.labStream(userId));

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new_alert' && data.alert) {
          setAlerts(prev => {
            // Add new alert to the beginning, keep max 10 alerts
            const newAlerts = [data.alert, ...prev];
            return newAlerts.slice(0, 10);
          });

          // Announce new alert to screen readers
          setAnnouncement(`New ${data.alert.severity} severity alert: ${data.alert.ioc}`);
          setTimeout(() => setAnnouncement(''), 1000); // Clear after announcement
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  return (
    <section className="space-y-4">
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-inter text-2xl font-bold text-och-defender-blue">
          🕶️ LIVE LAB FEED
        </h2>
        <span
          className="px-3 py-1 bg-och-steel-grey/50 rounded-full text-xs font-mono"
          aria-label={`${alerts.length} active alerts`}
        >
          {alerts.length} active
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg">
          <div className="text-red-400 font-medium">Failed to load lab feed</div>
          <div className="text-red-300 text-sm mt-1">Please try refreshing the page</div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-xl bg-och-steel-grey/30 p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-och-steel-grey/50 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-och-steel-grey/50 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-och-steel-grey/50 rounded w-2/3 mx-auto"></div>
          </div>
          <div className="text-och-steel-grey text-sm mt-4">Loading lab feed...</div>
        </div>
      )}

      {/* IOC Table */}
      {alerts.length > 0 && !error && (
        <div className="overflow-x-auto rounded-xl bg-och-steel-grey/30 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-och-steel-grey/50">
                <th className="text-left p-2 font-medium text-och-steel-grey">IOC</th>
                <th className="text-left p-2 font-medium text-och-steel-grey">Type</th>
                <th className="text-left p-2 font-medium text-och-steel-grey">Severity</th>
                <th className="text-left p-2 font-medium text-och-steel-grey">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-och-defender-blue/10 transition-colors">
                  <td className="font-mono p-2 text-och-cyber-mint">{alert.ioc}</td>
                  <td className="p-2">{alert.type}</td>
                  <td className="p-2">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="p-2">
                    <button className="px-3 py-1 text-xs bg-och-defender-blue/20 hover:bg-och-defender-blue/40 text-och-defender-blue rounded transition-colors">
                      DETAILS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {alerts.length === 0 && !isLoading && !error && (
        <div className="rounded-xl bg-och-steel-grey/30 p-8 text-center">
          <div className="text-och-steel-grey">No active alerts</div>
        </div>
      )}

      {/* Real-time indicator */}
      <div className="flex items-center gap-2 text-xs text-och-cyber-mint">
        <div className="w-2 h-2 bg-och-cyber-mint rounded-full animate-pulse"></div>
        Live feed active
      </div>
    </section>
  );
};
