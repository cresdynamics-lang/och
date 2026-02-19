import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { Building2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SponsorTableProps {
  userId: string;
}

interface SponsorInvoiceRow {
  id: string;
  name: string;
  amount: number;
  status: string;
  dueDate?: string;
  lastPayment?: string;
}

export const SponsorTable = ({ userId }: SponsorTableProps) => {
  const { data, error } = useSWR<SponsorInvoiceRow[]>(
    `/api/finance/${userId}/sponsors`,
    fetcher,
    {
      refreshInterval: 30000,
    }
  );

  const sponsors: SponsorInvoiceRow[] = Array.isArray(data) ? data : [];

  const getStatusBadge = (status: string) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'paid':
      case 'settled':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ Paid</Badge>;
      case 'due':
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Due Soon</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
          <Building2 className="w-5 h-5 text-cyan-400" />
          Sponsor Invoices
        </h3>
      </CardHeader>
      <CardContent>
        {!sponsors.length && !error && (
          <div className="text-sm text-slate-400">
            No sponsor invoices found yet for this account.
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400">
            Failed to load sponsor invoices. Please try again.
          </div>
        )}

        {!!sponsors.length && (
          <div className="space-y-4">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-700/50">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{sponsor.name}</div>
                    <div className="text-sm text-slate-400">
                      KES {Number(sponsor.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(sponsor.status)}
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {sponsor.dueDate || sponsor.lastPayment || ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
