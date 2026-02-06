'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Download, Plus } from 'lucide-react';

interface BillingInfoProps {
  billing: {
    paymentMethod: {
      type: 'card' | 'mpesa';
      last4?: string;
      brand?: string;
    };
    nextBilling: {
      date: string;
      amount: number;
      currency: string;
    };
    history: Array<{
      id: string;
      date: string;
      amount: number;
      currency: string;
      status: 'paid' | 'pending' | 'failed';
      invoiceUrl?: string;
    }>;
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const BillingInfo = ({ billing, userId, onUpdate }: BillingInfoProps) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency === 'KES' ? 'KES' : 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-och-sahara-gold/20 text-och-sahara-gold border-och-sahara-gold/30">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return null;
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceUrl?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else {
      // Fetch invoice
      const response = await fetch(`/api/analyst/${userId}/settings/subscription/invoices/${invoiceId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-och-defender-blue" />
        Billing Information
      </h4>

      {/* Payment Method */}
      <div className="p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium">Payment Method</div>
            <div className="text-sm text-och-steel-grey mt-1">
              {billing.paymentMethod.type === 'card' ? (
                <>
                  {billing.paymentMethod.brand?.toUpperCase()} •••• {billing.paymentMethod.last4}
                </>
              ) : (
                'M-Pesa'
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Update
          </Button>
        </div>
      </div>

      {/* Next Billing */}
      <div className="p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="text-sm text-och-steel-grey mb-1">Next Billing</div>
        <div className="flex items-center justify-between">
          <div className="font-medium">
            {formatPrice(billing.nextBilling.amount, billing.nextBilling.currency)}
          </div>
          <div className="text-sm text-och-steel-grey">
            {new Date(billing.nextBilling.date).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h5 className="font-medium mb-3">Invoice History</h5>
        <div className="space-y-2">
          {billing.history.length > 0 ? (
            billing.history.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">
                      {formatPrice(invoice.amount, invoice.currency)}
                    </div>
                    <div className="text-sm text-och-steel-grey">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(invoice.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceUrl)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-och-steel-grey text-center py-4">
              No invoice history
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

