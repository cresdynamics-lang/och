import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { Building2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const SponsorTable = () => {
  const sponsors = [
    {
      name: 'MTN',
      amount: 500000,
      status: 'due',
      dueDate: 'Feb 15',
      icon: Building2,
      color: 'text-orange-400'
    },
    {
      name: 'Vodacom',
      amount: 300000,
      status: 'paid',
      dueDate: 'Paid',
      icon: Building2,
      color: 'text-green-400'
    },
    {
      name: 'Ecobank',
      amount: 200000,
      status: 'overdue',
      dueDate: 'Jan 30',
      icon: Building2,
      color: 'text-red-400'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'due':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ Paid</Badge>;
      case 'due':
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
        <div className="space-y-4">
          {sponsors.map((sponsor, index) => {
            const Icon = sponsor.icon;
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-700/50`}>
                    <Icon className={`w-5 h-5 ${sponsor.color}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{sponsor.name}</div>
                    <div className="text-sm text-slate-400">KES {sponsor.amount.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(sponsor.status)}
                  <div className="text-xs text-slate-400 mt-1 font-mono">{sponsor.dueDate}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-cyan-400">KES 1.2M</div>
              <div className="text-xs text-slate-400">Q1 Target</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">KES 800K</div>
              <div className="text-xs text-slate-400">Collected</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
