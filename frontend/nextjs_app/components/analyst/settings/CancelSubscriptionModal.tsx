'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle } from 'lucide-react';

interface CancelSubscriptionModalProps {
  userId: string;
  tier: {
    name: string;
    displayName: string;
    activeUntil: string;
  };
  onClose: () => void;
  onCancel: () => Promise<void>;
}

export const CancelSubscriptionModal = ({
  userId,
  tier,
  onClose,
  onCancel,
}: CancelSubscriptionModalProps) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel();
    } catch (error) {
      alert('Failed to cancel subscription');
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-och-midnight-black border border-red-500/30 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-bold text-red-400">Cancel Subscription</h3>
          </div>
          <button
            onClick={onClose}
            className="text-och-steel-grey hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-sm text-red-300 mb-2">
              Your subscription will remain active until:
            </div>
            <div className="font-medium">
              {new Date(tier.activeUntil).toLocaleDateString()}
            </div>
            <div className="text-xs text-och-steel-grey mt-2">
              After this date, you'll be downgraded to the Free tier.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Why are you cancelling? (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Help us improve..."
              className="w-full px-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isCancelling}
            >
              Keep Subscription
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

