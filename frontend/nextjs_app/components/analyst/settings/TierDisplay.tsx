'use client';

import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Users } from 'lucide-react';

interface TierDisplayProps {
  tier: {
    name: string;
    displayName: string;
    active: boolean;
    activeUntil: string;
    price: {
      amount: number;
      currency: string;
      period: string;
    };
  };
  seats: {
    used: number;
    total: number;
    upgradeAvailable: boolean;
  };
}

export const TierDisplay = ({ tier, seats }: TierDisplayProps) => {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency === 'KES' ? 'KES' : 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-gradient-to-r from-och-defender-blue/20 to-och-cyber-mint/10 border border-och-defender-blue/30 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold">{tier.displayName}</h3>
              {tier.active && (
                <Badge className="bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <div className="text-sm text-och-steel-grey">
              {formatPrice(tier.price.amount, tier.price.currency)}/{tier.price.period}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-och-steel-grey">Active Until</div>
            <div className="font-medium">
              {new Date(tier.activeUntil).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Seats Usage */}
        <div className="flex items-center gap-3 p-3 bg-och-midnight-black/50 rounded-lg">
          <Users className="w-5 h-5 text-och-defender-blue" />
          <div className="flex-1">
            <div className="text-sm text-och-steel-grey mb-1">Seats Used</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-och-steel-grey/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-och-defender-blue transition-all"
                  style={{ width: `${(seats.used / seats.total) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {seats.used}/{seats.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

