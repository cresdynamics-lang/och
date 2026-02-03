import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Users, Target, CheckCircle } from 'lucide-react';

export const PipelineChart = () => {
  const pipelineData = [
    { stage: 'Applied', count: 47, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Screening', count: 23, percentage: 49, color: 'bg-yellow-500' },
    { stage: 'Interview', count: 12, percentage: 26, color: 'bg-orange-500' },
    { stage: 'Offer', count: 3, percentage: 6, color: 'bg-green-500' },
    { stage: 'Placed', count: 12, percentage: 26, color: 'bg-emerald-500' },
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
          <Target className="w-5 h-5 text-cyan-400" />
          Placement Pipeline
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipelineData.map((stage, index) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-24 text-sm text-slate-300 font-mono">
                {stage.stage}
              </div>
              <div className="flex-1">
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right">
                <div className="text-sm font-bold text-white">{stage.count}</div>
                <div className="text-xs text-slate-400">{stage.percentage}%</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-cyan-400">47→12→3→12</div>
              <div className="text-xs text-slate-400">Pipeline Flow</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">26%</div>
              <div className="text-xs text-slate-400">Conversion Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">KES 50K</div>
              <div className="text-xs text-slate-400">Avg Placement</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
