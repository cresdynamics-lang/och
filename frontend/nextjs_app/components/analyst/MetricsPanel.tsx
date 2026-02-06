'use client';

import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { TrendingUp, Target, Users, BarChart3 } from 'lucide-react';

interface MetricsPanelProps {
  userId: string;
}

interface MetricsData {
  readiness: number;
  mttr: number;
  accuracy: number;
  cohortRank: number;
  cohortTotal: number;
  trends: Array<{
    metric: string;
    change: number;
    sparkline: number[];
  }>;
}

// KpiCard Component
interface KpiCardProps {
  label: string;
  value: string;
  target: string;
  status: 'success' | 'warning';
  trend: string;
}

const KpiCard = ({ label, value, target, status, trend }: KpiCardProps) => {
  const statusColors = {
    success: 'text-och-cyber-mint border-och-cyber-mint/20 bg-och-cyber-mint/5',
    warning: 'text-och-sahara-gold border-och-sahara-gold/20 bg-och-sahara-gold/5'
  };

  return (
    <div className={`p-2.5 rounded-lg border ${statusColors[status]} group hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-och-steel-grey uppercase tracking-wider truncate">{label}</span>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1 ${status === 'success' ? 'bg-och-cyber-mint' : 'bg-och-sahara-gold'}`} />
      </div>
      <div className="text-xl font-bold truncate">{value}</div>
      <div className="flex items-center gap-1 text-[10px] text-och-steel-grey mt-0.5">
        <Target className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="truncate">{target}</span>
      </div>
      <div className="text-[10px] font-medium mt-0.5">{trend}</div>
    </div>
  );
};

// TrendRow Component
interface TrendRowProps {
  trend: {
    metric: string;
    change: number;
    sparkline: number[];
  };
}

const TrendRow = ({ trend }: TrendRowProps) => {
  const isPositive = trend.change > 0;
  const maxValue = Math.max(...trend.sparkline);
  const minValue = Math.min(...trend.sparkline);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{trend.metric}</span>
        <span className={`text-xs font-bold ${isPositive ? 'text-och-cyber-mint' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{trend.change}%
        </span>
      </div>
      <div className="flex items-center gap-1">
        {trend.sparkline.map((value, index) => {
          const height = ((value - minValue) / (maxValue - minValue)) * 20 + 4; // 4-24px height
          return (
            <div
              key={index}
              className={`w-1 bg-och-defender-blue rounded-sm`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Skeleton Loader
const MetricsSkeleton = () => (
  <div className="h-full flex flex-col">
    {/* Header Skeleton */}
    <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
      <div className="h-6 bg-och-steel-grey/50 rounded w-20 animate-pulse"></div>
    </div>

    {/* KPI Cards Skeleton */}
    <div className="px-4 py-3 space-y-3 flex-shrink-0">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-och-steel-grey/30 p-3 rounded-xl animate-pulse">
          <div className="flex justify-between mb-1">
            <div className="h-3 bg-och-steel-grey/50 rounded w-16"></div>
            <div className="w-2 h-2 bg-och-steel-grey/50 rounded-full"></div>
          </div>
          <div className="h-6 bg-och-steel-grey/50 rounded w-12 mb-1"></div>
          <div className="h-3 bg-och-steel-grey/50 rounded w-20"></div>
        </div>
      ))}
    </div>

    {/* Trends Skeleton */}
    <div className="px-4 flex-1 overflow-y-auto space-y-3">
      <div className="h-4 bg-och-steel-grey/50 rounded w-24 animate-pulse"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex justify-between py-2 animate-pulse">
          <div className="h-4 bg-och-steel-grey/50 rounded w-32"></div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="w-1 h-6 bg-och-steel-grey/50 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Bottom sections skeleton */}
    <div className="m-4 border-t border-och-steel-grey/50 flex-shrink-0">
      <div className="p-4 bg-och-steel-grey/30 animate-pulse">
        <div className="h-4 bg-och-steel-grey/50 rounded w-32 mb-2"></div>
        <div className="flex justify-between">
          <div className="h-6 bg-och-steel-grey/50 rounded w-20"></div>
          <div className="h-4 bg-och-steel-grey/50 rounded w-16"></div>
        </div>
      </div>
      <div className="p-4">
        <div className="h-10 bg-och-sahara-gold/50 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Error State
const MetricsErrorState = () => (
  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
    <div className="text-6xl mb-4">📊</div>
    <h3 className="text-lg font-medium text-red-400 mb-2">Metrics Unavailable</h3>
    <p className="text-och-steel-grey text-sm mb-4">
      Unable to load performance metrics. Some data sources may be temporarily unavailable.
    </p>
    <Button className="bg-och-defender-blue hover:bg-och-defender-blue/90">
      Retry Loading
    </Button>
  </div>
);

export const MetricsPanel = ({ userId }: MetricsPanelProps) => {
  const { data: metricsData, error, isLoading } = useSWR<MetricsData>(
    `/api/analyst/${userId}/metrics/combined`,
    () => ({
      readiness: 82,
      mttr: 18,
      accuracy: 91,
      cohortRank: 3,
      cohortTotal: 127,
      trends: [
        {
          metric: 'Missions',
          change: 12,
          sparkline: [45, 52, 48, 55, 62, 58, 70]
        },
        {
          metric: 'Quizzes',
          change: 8,
          sparkline: [78, 82, 79, 85, 83, 87, 86]
        },
        {
          metric: 'Portfolio',
          change: 47,
          sparkline: [12, 18, 22, 28, 35, 41, 47]
        },
        {
          metric: 'Cohort',
          change: 3,
          sparkline: [75, 76, 74, 77, 76, 78, 78]
        }
      ]
    }),
    { refreshInterval: 10000 } // 10s live updates
  );

  const handleViewAnalytics = () => {
    console.log('Viewing full analytics dashboard');
    // TODO: Navigate to full analytics dashboard
  };

  if (isLoading) return <MetricsSkeleton />;
  if (error || !metricsData) return <MetricsErrorState />;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-och-steel-grey to-och-midnight-black">
      {/* Header */}
      <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
        <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2 mb-3">
          📈 METRICS
        </h3>
      </div>

      {/* Core KPIs */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 flex-shrink-0">
        <KpiCard
          label="Readiness"
          value={`${metricsData.readiness}%`}
          target="SOC L1"
          status="success"
          trend="+3%"
        />
        <KpiCard
          label="Lab MTTR"
          value={`${metricsData.mttr}min`}
          target="<30min"
          status="success"
          trend="-2min"
        />
        <KpiCard
          label="Accuracy"
          value={`${metricsData.accuracy}%`}
          target=">85%"
          status="success"
          trend="+4%"
        />
      </div>

      {/* Trends */}
      <div className="px-4 flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-och-sahara-gold uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" />
          7-DAY TREND
        </div>

        {metricsData.trends.map((trend, i) => (
          <TrendRow key={i} trend={trend} />
        ))}
      </div>

      {/* Cohort Comparison */}
      <div className="m-4 border border-och-cyber-mint/20 bg-och-cyber-mint/5 border-opacity-50 flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-och-steel-grey mb-2">
            <Users className="w-4 h-4" />
            <span>VS COHORT (78% avg)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-och-cyber-mint">
              YOU: {metricsData.readiness}%
            </div>
            <div className="text-sm text-och-steel-grey">
              #{metricsData.cohortRank}/{metricsData.cohortTotal} Nairobi
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-och-steel-grey/50 flex-shrink-0">
        <Button
          className="w-full bg-och-sahara-gold hover:bg-och-sahara-gold/90 text-black font-medium"
          onClick={handleViewAnalytics}
        >
          VIEW FULL ANALYTICS →
        </Button>
      </div>
    </div>
  );
};
