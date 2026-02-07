'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Monitor, Smartphone, Tablet, LogOut } from 'lucide-react';

interface SessionManagementProps {
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    ipAddress: string;
    lastActivity: string;
    isCurrent: boolean;
  }>;
  userId: string;
  onUpdate: () => Promise<void>;
}

export const SessionManagement = ({ sessions, userId, onUpdate }: SessionManagementProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to log out of all devices?')) return;
    
    setIsLoggingOut(true);
    try {
      await fetch('/api/sponsor/settings/logout-all', {
        method: 'POST',
      });
      await onUpdate();
      alert('Logged out of all devices');
    } catch (error) {
      alert('Failed to log out all devices');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />;
    if (device.toLowerCase().includes('tablet')) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 id="sessions-heading" className="text-lg font-semibold text-white mb-1">
            Active Sessions
          </h3>
          <p className="text-sm text-och-steel">
            Manage your active login sessions across devices
          </p>
        </div>
        {sessions.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleLogoutAll}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? 'Logging out...' : 'Log Out All'}
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20 text-center text-och-steel">
          No active sessions
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 bg-och-steel/10 rounded-lg border border-och-steel/20"
            >
              <div className="flex items-center gap-3">
                {getDeviceIcon(session.device)}
                <div>
                  <div className="text-white font-medium">{session.device}</div>
                  <div className="text-xs text-och-steel">
                    {session.location} • {session.ipAddress}
                  </div>
                  <div className="text-xs text-och-steel">
                    Last activity: {new Date(session.lastActivity).toLocaleString()}
                  </div>
                </div>
              </div>
              {session.isCurrent && (
                <Badge variant="mint">Current</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

