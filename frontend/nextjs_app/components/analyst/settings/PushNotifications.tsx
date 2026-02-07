'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Bell, Send } from 'lucide-react';

interface PushNotificationsProps {
  push: {
    enabled: boolean;
    deviceTokens: string[];
    categories: {
      newMission: boolean;
      streakBroken: boolean;
    };
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const PushNotifications = ({ push, userId, onUpdate }: PushNotificationsProps) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    await onUpdate({ enabled });
  };

  const handleCategoryToggle = async (category: string, enabled: boolean) => {
    await onUpdate({
      categories: { ...push.categories, [category]: enabled }
    });
  };

  const handleTestPush = async () => {
    setIsTesting(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/notifications/test-push`, {
        method: 'POST',
      });
      alert('Test push notification sent!');
    } catch (error) {
      alert('Failed to send test push notification');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">Push Notifications</div>
            <div className="text-sm text-och-steel-grey">
              {push.deviceTokens.length} device{push.deviceTokens.length !== 1 ? 's' : ''} registered
            </div>
          </div>
        </div>
        <Switch checked={push.enabled} onCheckedChange={handleToggle} />
      </div>

      {push.enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-och-defender-blue/30">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">New Mission</span>
                <Switch
                  checked={push.categories.newMission}
                  onCheckedChange={(enabled) => handleCategoryToggle('newMission', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">Streak Broken</span>
                <Switch
                  checked={push.categories.streakBroken}
                  onCheckedChange={(enabled) => handleCategoryToggle('streakBroken', enabled)}
                />
              </div>
            </div>
          </div>

          {/* Test Push */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestPush}
            disabled={isTesting}
          >
            <Send className="w-4 h-4 mr-2" />
            {isTesting ? 'Sending...' : 'Send Test Push'}
          </Button>
        </div>
      )}
    </div>
  );
};

