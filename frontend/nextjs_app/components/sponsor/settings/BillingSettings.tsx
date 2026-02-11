'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Download, TrendingUp } from 'lucide-react';
import type { BillingSettings as BillingSettingsType } from '@/types/sponsor-settings';

interface BillingSettingsProps {
  userId: string;
  data: BillingSettingsType;
  onUpdate: (section: string, updates: any) => Promise<void>;
}

export const BillingSettings = ({ userId, data, onUpdate }: BillingSettingsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Billing & Subscription</h2>
        <p className="text-och-steel text-sm">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-och-defender" />
          Subscription
        </h3>

        <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold capitalize">{data.subscription.tier} Plan</div>
              <div className="text-sm text-och-steel">
                {data.subscription.seatsUsed} / {data.subscription.seatsAllocated} seats used
              </div>
            </div>
            <Badge variant={data.subscription.status === 'active' ? 'mint' : 'orange'}>
              {data.subscription.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-och-steel/20">
            <span className="text-sm text-och-steel">Next billing date</span>
            <span className="text-white">
              {data.subscription.nextBillingDate
                ? new Date(data.subscription.nextBillingDate).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
          <Button variant="outline" size="sm">Upgrade Plan</Button>
        </div>
      </section>

      <section className="border-t border-och-steel/30 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Usage & Costs</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
            <div className="text-sm text-och-steel mb-1">Current Month</div>
            <div className="text-2xl font-bold text-white">{data.usage.currentMonth.seatsUsed}</div>
            <div className="text-sm text-och-steel">seats • BWP {data.usage.currentMonth.cost.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20">
            <div className="text-sm text-och-steel mb-1">Last Month</div>
            <div className="text-2xl font-bold text-white">{data.usage.lastMonth.seatsUsed}</div>
            <div className="text-sm text-och-steel">seats • BWP {data.usage.lastMonth.cost.toLocaleString()}</div>
          </div>
        </div>
      </section>

      <section className="border-t border-och-steel/30 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Invoices</h3>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>
        {data.invoices.length === 0 ? (
          <div className="p-4 bg-och-steel/10 rounded-lg border border-och-steel/20 text-center text-och-steel">
            No invoices yet
          </div>
        ) : (
          <div className="space-y-2">
            {data.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-och-steel/10 rounded-lg border border-och-steel/20"
              >
                <div>
                  <div className="text-white font-medium">Invoice #{invoice.id.slice(0, 8)}</div>
                  <div className="text-sm text-och-steel">
                    {invoice.currency} {invoice.amount.toLocaleString()} • Due {new Date(invoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={invoice.status === 'paid' ? 'mint' : invoice.status === 'overdue' ? 'orange' : 'gold'}>
                  {invoice.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

