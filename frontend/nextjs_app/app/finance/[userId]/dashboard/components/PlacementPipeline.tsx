import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, TrendingUp, Users, Target, DollarSign } from 'lucide-react';

interface PlacementPipelineProps {
  activePlacements: number;
  totalValue: number;
  averageSalary: number;
}

export const PlacementPipeline = ({
  activePlacements,
  totalValue,
  averageSalary,
}: PlacementPipelineProps) => {
  const hasData = activePlacements > 0 || totalValue > 0;

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
          <Target className="w-5 h-5 text-cyan-400" />
          Active Placements Summary
        </h3>
      </CardHeader>
      <CardContent>
        {!hasData && (
          <div className="text-sm text-slate-400">
            No placement revenue has been recorded yet for this sponsor.
          </div>
        )}

        {hasData && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xl font-bold text-cyan-400">
                  {activePlacements}
                </div>
                <div className="text-xs text-slate-400">Total Hires</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-400">
                  KES {Number(totalValue || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Total Revenue Share</div>
              </div>
              <div>
                <div className="text-xl font-bold text-yellow-400">
                  KES {Number(averageSalary || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Avg Revenue / Hire</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
