'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  TrendingDown,
  Users,
  Target,
  Sparkles,
  Clock,
  DollarSign,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface AIAlert {
  id: string;
  type: string;
  priority: number;
  title: string;
  description: string;
  cohort_name: string;
  risk_score?: number;
  recommended_action: string;
  roi_estimate: string;
  action_url: string;
  expires_at?: string;
}

interface AIAlertsPanelProps {
  alerts: AIAlert[];
}

const ALERT_TYPE_CONFIGS = {
  dropout_risk: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    label: 'Risk Alert'
  },
  placement_bottleneck: {
    icon: Target,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    label: 'Placement Issue'
  },
  curriculum_completion: {
    icon: TrendingDown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    label: 'Progress Update'
  },
  hiring_success: {
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    label: 'Success Alert'
  }
};

function getPriorityBadge(priority: number) {
  switch (priority) {
    case 1:
      return { label: 'CRITICAL', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    case 2:
      return { label: 'HIGH', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 3:
      return { label: 'MEDIUM', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    default:
      return { label: 'LOW', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  }
}

export function AIAlertsPanel({ alerts }: AIAlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-700 text-center">
        <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-2">All Clear</h3>
        <p className="text-slate-400 text-sm">
          No AI alerts at this time. Cohort is performing well!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const typeConfig = ALERT_TYPE_CONFIGS[alert.type as keyof typeof ALERT_TYPE_CONFIGS] || ALERT_TYPE_CONFIGS.dropout_risk;
        const priorityConfig = getPriorityBadge(alert.priority);
        const IconComponent = typeConfig.icon;

        return (
          <Card
            key={alert.id}
            className={`p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/30 border ${typeConfig.borderColor} hover:border-opacity-60 transition-all duration-200`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                  <IconComponent className={`w-4 h-4 ${typeConfig.color}`} />
                </div>
                <div>
                  <Badge className={`${typeConfig.bgColor} ${typeConfig.color} text-xs px-2 py-0.5 mb-1`}>
                    {typeConfig.label}
                  </Badge>
                  <h4 className="text-white font-semibold text-sm leading-tight">
                    {alert.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={`${priorityConfig.color} text-xs px-2 py-0.5`}>
                  {priorityConfig.label}
                </Badge>
                {alert.roi_estimate && (
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2 py-0.5">
                    {alert.roi_estimate} ROI
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm mb-3 leading-relaxed">
              {alert.description}
            </p>

            {/* Risk Score (if applicable) */}
            {alert.risk_score && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-red-400 text-sm font-medium">Risk Score</span>
                  <span className="text-red-400 font-bold text-lg">{alert.risk_score}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${Math.min(alert.risk_score * 10, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recommended Action */}
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 mb-4">
              <h5 className="text-white text-sm font-medium mb-1">Recommended Action</h5>
              <p className="text-slate-300 text-sm">{alert.recommended_action}</p>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {alert.cohort_name}
              </div>

              <Link href={alert.action_url}>
                <Button
                  size="sm"
                  className={`${
                    alert.priority === 1
                      ? 'bg-red-600 hover:bg-red-700'
                      : alert.priority === 2
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Take Action
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

