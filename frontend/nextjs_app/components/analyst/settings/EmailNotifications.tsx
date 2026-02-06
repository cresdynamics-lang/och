'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Mail, Send } from 'lucide-react';

interface EmailNotificationsProps {
  email: {
    enabled: boolean;
    frequency: 'daily' | 'immediate';
    categories: {
      dailyDigest: boolean;
      quizDue: boolean;
      careerMatch: boolean;
    };
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const EmailNotifications = ({ email, userId, onUpdate }: EmailNotificationsProps) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    await onUpdate({ enabled });
  };

  const handleFrequencyChange = async (frequency: 'daily' | 'immediate') => {
    await onUpdate({ frequency });
  };

  const handleCategoryToggle = async (category: string, enabled: boolean) => {
    await onUpdate({
      categories: { ...email.categories, [category]: enabled }
    });
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      await fetch(`/api/analyst/${userId}/settings/notifications/test-email`, {
        method: 'POST',
      });
      alert('Test email sent! Check your inbox.');
    } catch (error) {
      alert('Failed to send test email');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-och-defender-blue" />
          <div>
            <div className="font-medium">Email Notifications</div>
            <div className="text-sm text-och-steel-grey">Receive updates via email</div>
          </div>
        </div>
        <Switch checked={email.enabled} onCheckedChange={handleToggle} />
      </div>

      {email.enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-och-defender-blue/30">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFrequencyChange('daily')}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  email.frequency === 'daily'
                    ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                    : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
                }`}
              >
                Daily Digest
              </button>
              <button
                onClick={() => handleFrequencyChange('immediate')}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  email.frequency === 'immediate'
                    ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                    : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
                }`}
              >
                Immediate
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">Daily Digest</span>
                <Switch
                  checked={email.categories.dailyDigest}
                  onCheckedChange={(enabled) => handleCategoryToggle('dailyDigest', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">Quiz Due</span>
                <Switch
                  checked={email.categories.quizDue}
                  onCheckedChange={(enabled) => handleCategoryToggle('quizDue', enabled)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-och-steel-grey/5 border border-och-steel-grey/20 rounded-lg">
                <span className="text-sm">Career Match</span>
                <Switch
                  checked={email.categories.careerMatch}
                  onCheckedChange={(enabled) => handleCategoryToggle('careerMatch', enabled)}
                />
              </div>
            </div>
          </div>

          {/* Test Email */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestEmail}
            disabled={isTesting}
          >
            <Send className="w-4 h-4 mr-2" />
            {isTesting ? 'Sending...' : 'Send Test Email'}
          </Button>
        </div>
      )}
    </div>
  );
};

