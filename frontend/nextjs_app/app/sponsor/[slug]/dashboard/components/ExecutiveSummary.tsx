'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: {
    active_students: number;
    completion_rate: number;
    placement_rate: number;
    roi: number;
    hires_last_30d: number;
    ai_readiness_avg: number;
  };
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color: string;
  bgColor: string;
}

function MetricCard({ icon, label, value, change, changeType, color, bgColor }: MetricCardProps) {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {change && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                changeType === 'positive' ? 'bg-green-500/20 text-green-400' :
                changeType === 'negative' ? 'bg-red-500/20 text-red-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {changeType === 'positive' ? <ArrowUp className="w-3 h-3" /> :
                 changeType === 'negative' ? <ArrowDown className="w-3 h-3" /> :
                 <Activity className="w-3 h-3" />}
                {change}
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <div className={color}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  const [animatedValues, setAnimatedValues] = useState({
    active_students: 0,
    completion_rate: 0,
    placement_rate: 0,
    roi: 0,
    hires_last_30d: 0,
    ai_readiness_avg: 0
  });

  useEffect(() => {
    // Animate counters on mount
    const duration = 1000;
    const steps = 60;
    const increment = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setAnimatedValues({
        active_students: Math.round(summary.active_students * progress),
        completion_rate: Math.round(summary.completion_rate * progress * 10) / 10,
        placement_rate: Math.round(summary.placement_rate * progress * 10) / 10,
        roi: Math.round(summary.roi * progress * 10) / 10,
        hires_last_30d: Math.round(summary.hires_last_30d * progress),
        ai_readiness_avg: Math.round(summary.ai_readiness_avg * progress * 10) / 10
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValues(summary);
      }
    }, increment);

    return () => clearInterval(timer);
  }, [summary]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
      <MetricCard
        icon={<Users className="w-6 h-6" />}
        label="Active Students"
        value={animatedValues.active_students}
        change="+12%"
        changeType="positive"
        color="text-blue-400"
        bgColor="bg-blue-500/20"
      />

      <MetricCard
        icon={<TrendingUp className="w-6 h-6" />}
        label="Completion Rate"
        value={`${animatedValues.completion_rate}%`}
        change="+5.2%"
        changeType="positive"
        color="text-emerald-400"
        bgColor="bg-emerald-500/20"
      />

      <MetricCard
        icon={<Target className="w-6 h-6" />}
        label="Placement Rate"
        value={`${animatedValues.placement_rate}%`}
        change="+2.1%"
        changeType="positive"
        color="text-amber-400"
        bgColor="bg-amber-500/20"
      />

      <MetricCard
        icon={<DollarSign className="w-6 h-6" />}
        label="ROI"
        value={`${animatedValues.roi}x`}
        change="+0.3x"
        changeType="positive"
        color="text-green-400"
        bgColor="bg-green-500/20"
      />

      <MetricCard
        icon={<Activity className="w-6 h-6" />}
        label="Hires (30d)"
        value={animatedValues.hires_last_30d}
        change="+2"
        changeType="positive"
        color="text-purple-400"
        bgColor="bg-purple-500/20"
      />

      <MetricCard
        icon={<TrendingUp className="w-6 h-6" />}
        label="AI Readiness"
        value={`${animatedValues.ai_readiness_avg}%`}
        change="+3.4%"
        changeType="positive"
        color="text-cyan-400"
        bgColor="bg-cyan-500/20"
      />
    </div>
  );
}

