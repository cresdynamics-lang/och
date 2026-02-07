'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { TierDisplay } from './TierDisplay';
import { BillingInfo } from './BillingInfo';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import type { SubscriptionSettings as SubscriptionSettingsType } from '@/types/analyst-settings';

interface SubscriptionSettingsProps {
  userId: string;
  data: SubscriptionSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const SubscriptionSettings = ({ userId, data, onUpdate }: SubscriptionSettingsProps) => {
  const [showCancelModal, setShowCancelModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Current Tier */}
      <section aria-labelledby="tier-heading">
        <TierDisplay tier={data.tier} seats={data.seats} />
      </section>

      {/* Billing Information */}
      <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="billing-heading">
        <BillingInfo
          billing={data.billing}
          userId={userId}
          onUpdate={(updates) => onUpdate('subscription', { billing: { ...data.billing, ...updates } })}
        />
      </section>

      {/* Upgrade Options */}
      {data.seats.upgradeAvailable && (
        <section className="border-t border-och-steel-grey/30 pt-6" aria-labelledby="upgrade-heading">
          <div className="p-4 bg-och-cyber-mint/10 border border-och-cyber-mint/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-och-cyber-mint" />
              <h4 id="upgrade-heading" className="font-medium text-och-cyber-mint">Upgrade Available</h4>
            </div>
            <div className="text-sm text-och-steel-grey mb-3">
              Upgrade to Pro7 Max for multi-cohort access and additional features.
            </div>
            <Button size="sm" className="bg-och-cyber-mint hover:bg-och-cyber-mint/90 text-black">
              View Upgrade Options
            </Button>
          </div>
        </section>
      )}

      {/* Cancel Subscription */}
      <section className="border-t border-red-500/30 pt-6" aria-labelledby="cancel-heading">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancel Subscription
              </div>
              <div className="text-sm text-och-steel-grey mt-1">
                Your subscription will remain active until {new Date(data.tier.activeUntil).toLocaleDateString()}
              </div>
            </div>
            <Button
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/20"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </section>

      {showCancelModal && (
        <CancelSubscriptionModal
          userId={userId}
          tier={data.tier}
          onClose={() => setShowCancelModal(false)}
          onCancel={async () => {
            await onUpdate('subscription', {
              tier: { ...data.tier, active: false }
            });
            setShowCancelModal(false);
          }}
        />
      )}
    </div>
  );
};

