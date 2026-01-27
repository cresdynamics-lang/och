'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calculator,
  BarChart3,
  Zap,
  Users,
  DollarSign
} from 'lucide-react';

interface ForecastScenario {
  name: string;
  description: string;
  change: number; // percentage
  expectedRevenue: number;
  confidence: number; // 0-100
  factors: string[];
}

interface RevenueForecastingProps {
  currentRevenue: number;
  currentHires: number;
  completionRate: number;
  className?: string;
}

export function RevenueForecasting({
  currentRevenue,
  currentHires,
  completionRate,
  className = ''
}: RevenueForecastingProps) {
  // Mock forecasting data - in real app, this would come from AI/ML models
  const scenarios: ForecastScenario[] = [
    {
      name: 'Conservative Growth',
      description: 'Steady 15% quarterly growth based on current trends',
      change: 15,
      expectedRevenue: currentRevenue * 1.15,
      confidence: 85,
      factors: ['Current completion rate', 'Historical hiring patterns', 'Market conditions']
    },
    {
      name: 'Aggressive Growth',
      description: '35% growth with improved completion rates',
      change: 35,
      expectedRevenue: currentRevenue * 1.35,
      confidence: 65,
      factors: ['AI intervention boost', 'Mentor engagement', 'Industry demand']
    },
    {
      name: 'Optimistic Scenario',
      description: '50% growth with full cohort utilization',
      change: 50,
      expectedRevenue: currentRevenue * 1.5,
      confidence: 45,
      factors: ['Scale to maximum capacity', 'Market expansion', 'Partnership growth']
    }
  ];

  const whatIfScenarios = [
    {
      scenario: '+10% Completion Rate',
      impact: `+KES ${(currentRevenue * 0.1).toLocaleString()} revenue`,
      hires: `+${Math.round(currentHires * 0.1)} hires`,
      color: 'text-green-400'
    },
    {
      scenario: '-5% Dropout Rate',
      impact: `+KES ${(currentRevenue * 0.15).toLocaleString()} revenue`,
      hires: `+${Math.round(currentHires * 0.15)} hires`,
      color: 'text-blue-400'
    },
    {
      scenario: '+20% Cohort Size',
      impact: `+KES ${(currentRevenue * 0.25).toLocaleString()} revenue`,
      hires: `+${Math.round(currentHires * 0.25)} hires`,
      color: 'text-purple-400'
    }
  ];

  const quarterlyProjection = [
    { quarter: 'Q1 2026', revenue: currentRevenue, hires: currentHires },
    { quarter: 'Q2 2026', revenue: currentRevenue * 1.2, hires: Math.round(currentHires * 1.2) },
    { quarter: 'Q3 2026', revenue: currentRevenue * 1.45, hires: Math.round(currentHires * 1.45) },
    { quarter: 'Q4 2026', revenue: currentRevenue * 1.7, hires: Math.round(currentHires * 1.7) }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quarterly Projection Chart */}
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Revenue Projection</h3>
            <p className="text-slate-400 text-sm">Quarterly forecast based on current trends</p>
          </div>
          <Badge className="bg-green-500/20 text-green-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            +40% YoY
          </Badge>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-4">
          {quarterlyProjection.map((q, index) => (
            <div key={q.quarter} className="flex items-center gap-4">
              <div className="w-16 text-sm text-slate-400">{q.quarter}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">
                    KES {(q.revenue / 1000).toFixed(0)}K
                  </span>
                  <span className="text-slate-400 text-xs">
                    {q.hires} hires
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(q.revenue / quarterlyProjection[3].revenue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Growth Scenarios */}
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Growth Scenarios</h3>

        <div className="space-y-4">
          {scenarios.map((scenario, index) => (
            <div key={scenario.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{scenario.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge className={`${
                    scenario.confidence >= 80 ? 'bg-green-500/20 text-green-400' :
                    scenario.confidence >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {scenario.confidence}% confidence
                  </Badge>
                  <Badge className="bg-amber-500/20 text-amber-400">
                    +{scenario.change}%
                  </Badge>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-3">{scenario.description}</p>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-semibold">
                    KES {(scenario.expectedRevenue / 1000).toFixed(0)}K
                  </div>
                  <div className="text-slate-400 text-xs">Expected Q2 revenue</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-sm font-medium">
                    +KES {((scenario.expectedRevenue - currentRevenue) / 1000).toFixed(0)}K
                  </div>
                  <div className="text-slate-400 text-xs">vs current</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {scenario.factors.map(factor => (
                  <Badge key={factor} variant="outline" className="text-xs border-slate-600 text-slate-300">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* What-If Scenarios */}
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">What-If Analysis</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {whatIfScenarios.map((scenario, index) => (
            <div key={scenario.scenario} className="text-center p-4 border border-slate-700 rounded-lg">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calculator className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-white text-sm font-medium mb-2">{scenario.scenario}</h4>
              <div className={`text-lg font-semibold mb-1 ${scenario.color}`}>
                {scenario.impact}
              </div>
              <div className="text-slate-400 text-xs">{scenario.hires}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium mb-1">AI-Powered Forecasting</h4>
              <p className="text-slate-400 text-sm">
                Predictions based on completion rates, hiring patterns, and market trends
              </p>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
