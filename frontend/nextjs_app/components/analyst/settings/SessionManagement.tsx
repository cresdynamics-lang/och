'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LogOut, Monitor, Smartphone, Tablet } from 'lucide-react';

interface SessionManagementProps {
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  userId: string;
  onUpdate: (sessions: any[]) => Promise<void>;
}

export const SessionManagement = ({ sessions, userId, onUpdate }: SessionManagementProps) => {
  const [loggingOut, setLoggingOut] = useState<string | null>(null);

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (device.toLowerCase().includes('ipad') || device.toLowerCase().includes('tablet')) {
      return <Tablet className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const handleLogout = async (sessionId: string) => {
    setLoggingOut(sessionId);
    try {
      await fetch(`/api/analyst/${userId}/settings/account/sessions/${sessionId}/logout`, {
        method: 'POST',
      });
      await onUpdate(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      alert('Failed to log out session');
    } finally {
      setLoggingOut(null);
    }
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  if (sessions.length === 0) {
    return (
      <div className="text-sm text-och-steel-grey text-center py-4">
        No active sessions
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-och-defender-blue/20 rounded-lg flex items-center justify-center text-och-defender-blue">
              {getDeviceIcon(session.device)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{session.device}</span>
                {session.current && (
                  <Badge className="bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30 text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <div className="text-sm text-och-steel-grey mt-1">
                {session.location} • {formatLastActive(session.lastActive)}
              </div>
            </div>
          </div>
          {!session.current && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLogout(session.id)}
              disabled={loggingOut === session.id}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {loggingOut === session.id ? 'Logging out...' : 'Log Out'}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

