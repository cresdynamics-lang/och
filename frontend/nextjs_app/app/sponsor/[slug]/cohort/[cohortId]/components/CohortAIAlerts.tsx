'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Lightbulb,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';

interface AIAlert {
  type: string;
  priority: number;
  title: string;
  description: string;
  recommended_action: string;
}

interface AIRecommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  expected_impact: string;
}

interface CohortAIAlertsProps {
  alerts: AIAlert[];
  recommendations: AIRecommendation[];
}

const ALERT_TYPE_CONFIGS = {
  dropout_risk: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    label: 'Risk Alert'
  },
  curriculum_block: {
    icon: BookOpen,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    label: 'Curriculum Block'
  },
  placement_opportunity: {
    icon: Target,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    label: 'Placement Opportunity'
  },
  success: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    label: 'Success'
  }
};

const RECOMMENDATION_TYPE_CONFIGS = {
  intervention: {
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  },
  curriculum: {
    icon: BookOpen,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  enrollment: {
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
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

function getRecommendationPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export function CohortAIAlerts({ alerts, recommendations }: CohortAIAlertsProps) {
  if (alerts.length === 0 && recommendations.length === 0) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-700 text-center">
        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-2">All Clear</h3>
        <p className="text-slate-400 text-sm">
          No AI alerts at this time. Cohort is performing well!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Alerts */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">AI Alerts</h3>
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
              {alerts.length} active
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {alerts.map((alert, index) => {
              const config = ALERT_TYPE_CONFIGS[alert.type as keyof typeof ALERT_TYPE_CONFIGS] || ALERT_TYPE_CONFIGS.dropout_risk;
              const priorityConfig = getPriorityBadge(alert.priority);
              const IconComponent = config.icon;

              return (
                <Card
                  key={index}
                  className={`p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/30 border ${config.borderColor} hover:border-opacity-60 transition-all duration-200`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <IconComponent className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <Badge className={`${config.bgColor} ${config.color} text-xs px-2 py-0.5 mb-1`}>
                          {config.label}
                        </Badge>
                        <h4 className="text-white font-semibold text-sm leading-tight">
                          {alert.title}
                        </h4>
                      </div>
                    </div>

                    <Badge className={`${priorityConfig.color} text-xs px-2 py-0.5`}>
                      {priorityConfig.label}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                    {alert.description}
                  </p>

                  {/* Recommended Action */}
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 mb-4">
                    <h5 className="text-white text-sm font-medium mb-1">Recommended Action</h5>
                    <p className="text-slate-300 text-sm">{alert.recommended_action}</p>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className={`w-full ${
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
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {recommendations.length} suggestions
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => {
              const config = RECOMMENDATION_TYPE_CONFIGS[rec.type as keyof typeof RECOMMENDATION_TYPE_CONFIGS] || RECOMMENDATION_TYPE_CONFIGS.intervention;
              const priorityColor = getRecommendationPriorityColor(rec.priority);
              const IconComponent = config.icon;

              return (
                <Card
                  key={index}
                  className="p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <IconComponent className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <Badge className={`${priorityColor} text-xs px-2 py-0.5 mb-1 capitalize`}>
                          {rec.priority} Priority
                        </Badge>
                        <h4 className="text-white font-semibold text-sm leading-tight">
                          {rec.title}
                        </h4>
                      </div>
                    </div>
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                    {rec.description}
                  </p>

                  {/* Expected Impact */}
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm font-medium">Expected Impact</span>
                    </div>
                    <p className="text-green-300 text-sm">{rec.expected_impact}</p>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-slate-400 border-slate-600 hover:text-white hover:border-slate-500"
                  >
                    Learn More
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
