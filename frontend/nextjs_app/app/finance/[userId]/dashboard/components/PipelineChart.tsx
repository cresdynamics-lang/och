import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Users, Target, CheckCircle } from 'lucide-react';

interface PipelineChartProps {
  activePlacements: number;
  conversionRate: number;
  monthlyRevenue: number;
}

export const PipelineChart = ({
  activePlacements,
  conversionRate,
  monthlyRevenue,
}: PipelineChartProps) => {
  const hasData = activePlacements > 0 || monthlyRevenue > 0;

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
          <Target className="w-5 h-5 text-cyan-400" />
          Placement Pipeline
        </h3>
      </CardHeader>
      <CardContent>
        {!hasData && (
          <div className="text-sm text-slate-400">
            No placement pipeline data available yet for this sponsor.
          </div>
        )}

        {hasData && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {activePlacements}
                </div>
                <div className="text-xs text-slate-400">Active Placements</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {Number.isFinite(conversionRate) ? `${conversionRate}%` : '—'}
                </div>
                <div className="text-xs text-slate-400">Conversion Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  KES {Number(monthlyRevenue || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Monthly Revenue</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
