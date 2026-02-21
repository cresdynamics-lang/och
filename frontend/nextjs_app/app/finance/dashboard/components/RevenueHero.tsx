import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { Button } from "@/components/ui/Button";
import { Download, FileText } from 'lucide-react';

interface RevenueHeroProps {
  revenue: {
    total: number;
    cohort: number;
    placements: number;
    pro7: number;
    roi: number;
    activeUsers: number;
    placementsCount: number;
    userId: string;
  };
  realtime?: any;
  showExportButtons?: boolean;
}

export const RevenueHero = ({ revenue, realtime, showExportButtons = true }: RevenueHeroProps) => (
  <Card className="cyber-gradient text-white border-0 shadow-2xl">
    <CardContent className="p-8 pt-10 pb-12">
      <div className="text-3xl font-black mb-2 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
        KES {revenue.total.toLocaleString()} TOTAL
      </div>
      <div className="text-sm text-cyan-200/80 mb-8 font-mono tracking-tight">
        {Number.isFinite(revenue.roi) ? `${revenue.roi.toFixed(2)}x ROI` : 'ROI —'} |{' '}
        {revenue.activeUsers} Active | {revenue.placementsCount} Placed
      </div>

      <div className="grid grid-cols-3 gap-6 text-sm">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-yellow-400">
            {revenue.cohort.toLocaleString()}
          </div>
          <div className="text-xs opacity-80">Cohort Value</div>
          <div className="text-xs text-slate-400 font-mono">From billing</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-emerald-400">
            {revenue.placements.toLocaleString()}
          </div>
          <div className="text-xs opacity-80">Placements</div>
          <div className="text-xs text-slate-400 font-mono">{revenue.placementsCount} hires</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-cyan-400">
            {revenue.pro7.toLocaleString()}
          </div>
          <div className="text-xs opacity-80">Pro7 MRR</div>
          <div className="text-xs text-slate-400 font-mono">{revenue.activeUsers} active/mo</div>
        </div>
      </div>

      {showExportButtons && (
        <div className="flex gap-3 mt-10 pt-10 border-t border-white/10">
          <Button
            size="lg"
            className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/20 font-mono text-white"
            onClick={() => {
              // Handle QuickBooks CSV export
              const link = document.createElement('a');
              link.href = `/api/finance/${revenue.userId || 'current'}/export/csv`;
              link.download = `och-finance-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            QuickBooks CSV ↓
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 font-mono text-white border-white/30 hover:bg-white/10"
            onClick={() => {
              // Handle ROI PDF export
              window.open(`/api/finance/${revenue.userId || 'current'}/export/pdf`, '_blank');
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            ROI PDF ↓
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);
