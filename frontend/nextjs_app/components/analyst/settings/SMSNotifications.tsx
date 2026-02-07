'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Smartphone, Send } from 'lucide-react';

interface SMSNotificationsProps {
  sms: {
    enabled: boolean;
    whatsappBusiness: boolean;
    categories: {
      urgentAlerts: boolean;
      mttrBreach: boolean;
      placement: boolean;
    };
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const SMSNotifications = ({ sms, userId, onUpdate }: SMSNotificationsProps) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    await onUpdate({ enabled });
  };

  const handleWhatsAppToggle = async (enabled: boolean) => {
    await onUpdate({ whatsappBusiness: enabled });
  };

  const handleCategoryToggle = async (category: string, enabled: boolean) => {
    await onUpdate({
      categories: { ...sms.categories, [category]: enabled }
    });
  };

  const handleTestSMS = async () => {
    setIsTesting(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/notifications/test-sms`, {
        method: 'POST',
      });
      alert('Test SMS sent! Check your phone.');
    } catch (error) {
      alert('Failed to send test SMS');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">SMS Notifications</div>
            <div className="text-sm text-och-steel-grey">Urgent alerts via SMS</div>
          </div>
        </div>
        <Switch checked={sms.enabled} onCheckedChange={handleToggle} />
      </div>

      {sms.enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-och-defender-blue/30">
          {/* WhatsApp Business */}
          <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
            <div>
              <div className="text-sm font-medium">WhatsApp Business</div>
              <div className="text-xs text-och-steel-grey">Use WhatsApp for urgent notifications</div>
            </div>
            <Switch checked={sms.whatsappBusiness} onCheckedChange={handleWhatsAppToggle} />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2">Categories (Urgent Only)</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">Urgent Alerts</span>
                <Switch
                  checked={sms.categories.urgentAlerts}
                  onCheckedChange={(enabled) => handleCategoryToggle('urgentAlerts', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">MTTR Breach</span>
                <Switch
                  checked={sms.categories.mttrBreach}
                  onCheckedChange={(enabled) => handleCategoryToggle('mttrBreach', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">Placement</span>
                <Switch
                  checked={sms.categories.placement}
                  onCheckedChange={(enabled) => handleCategoryToggle('placement', enabled)}
                />
              </div>
            </div>
          </div>

          {/* Test SMS */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestSMS}
            disabled={isTesting}
          >
            <Send className="w-4 h-4 mr-2" />
            {isTesting ? 'Sending...' : 'Send Test SMS'}
          </Button>
        </div>
      )}
    </div>
  );
};

