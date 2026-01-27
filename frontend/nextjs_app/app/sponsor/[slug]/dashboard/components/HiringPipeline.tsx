'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Target,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface HiringPipelineProps {
  pipeline: {
    total_candidates: number;
    hired_count: number;
    overall_conversion_rate: number;
    avg_time_to_hire_days: number;
    stages: Array<{
      stage: string;
      count: number;
      conversion_rate: number;
    }>;
  };
}

const STAGE_CONFIGS = {
  Applied: { color: 'bg-blue-500', icon: Users },
  Screened: { color: 'bg-amber-500', icon: Target },
  Interviewed: { color: 'bg-purple-500', icon: MessageSquare },
  'Offer Extended': { color: 'bg-orange-500', icon: Clock },
  Hired: { color: 'bg-green-500', icon: CheckCircle }
};

export function HiringPipeline({ pipeline }: HiringPipelineProps) {
  const maxCount = Math.max(...pipeline.stages.map(s => s.count));

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">{pipeline.hired_count}</div>
          <div className="text-slate-400 text-sm">Total Hires</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">{pipeline.overall_conversion_rate.toFixed(1)}%</div>
          <div className="text-slate-400 text-sm">Conversion Rate</div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-4">
        {pipeline.stages.map((stage, index) => {
          const config = STAGE_CONFIGS[stage.stage as keyof typeof STAGE_CONFIGS] || STAGE_CONFIGS.Applied;
          const IconComponent = config.icon;
          const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

          return (
            <div key={stage.stage} className="relative">
              {/* Stage Info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${config.color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                    <IconComponent className={`w-4 h-4 ${config.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{stage.stage}</h4>
                    <p className="text-slate-400 text-xs">{stage.count} candidates</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-semibold text-sm">
                    {stage.conversion_rate.toFixed(1)}%
                  </div>
                  <div className="text-slate-400 text-xs">conversion</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full ${config.color} transition-all duration-500`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>

                {/* Stage Connector */}
                {index < pipeline.stages.length - 1 && (
                  <div className="absolute top-1/2 left-full transform -translate-y-1/2 -translate-x-2 z-10">
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-white font-semibold text-sm mb-1">{pipeline.avg_time_to_hire_days}d</div>
            <div className="text-slate-400 text-xs">Avg Time to Hire</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-green-400 text-sm font-semibold mb-1">
              <TrendingUp className="w-3 h-3" />
              {pipeline.overall_conversion_rate.toFixed(1)}%
            </div>
            <div className="text-slate-400 text-xs">Overall Success</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

