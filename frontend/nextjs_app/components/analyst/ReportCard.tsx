'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { CardEnhanced, CardContent } from '@/components/ui/card-enhanced';
import { Badge } from '@/components/ui/Badge';
import { Download, Mail, Share, Clock, FileText, AlertTriangle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'lab' | 'custom';
  title: string;
  generatedAt?: string;
  status: 'ready' | 'generating' | 'expired';
  size?: string;
  shareable?: boolean;
  metrics?: {
    readiness?: number;
    cohortAvg?: number;
    mttr?: number;
    accuracy?: number;
  };
}

interface ReportAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface ReportCardProps {
  report?: Report;
  badge?: string;
  actions: ReportAction[];
  isLoading?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  badge,
  actions,
  isLoading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-och-cyber-mint';
      case 'generating': return 'text-och-sahara-gold animate-pulse';
      case 'expired': return 'text-red-400';
      default: return 'text-och-steel-grey';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-och-cyber-mint';
      case 'generating': return 'bg-och-sahara-gold animate-pulse';
      case 'expired': return 'bg-red-400';
      default: return 'bg-och-steel-grey';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return '📊';
      case 'weekly': return '📈';
      case 'lab': return '🚨';
      case 'custom': return '📋';
      default: return '📄';
    }
  };

  if (isLoading) {
    return (
      <CardEnhanced className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="h-4 bg-och-steel-grey/50 rounded w-3/4"></div>
            <div className="h-3 bg-och-steel-grey/50 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-och-steel-grey/50 rounded-full"></div>
            <div className="h-3 bg-och-steel-grey/50 rounded w-20"></div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-och-steel-grey/30 rounded flex-1"></div>
            ))}
          </div>
        </CardContent>
      </CardEnhanced>
    );
  }

  if (!report) {
    return (
      <CardEnhanced className="border-och-signal-orange/50 bg-och-signal-orange/5">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-och-signal-orange mx-auto mb-2" />
          <div className="text-sm text-och-signal-orange font-medium">Report Not Available</div>
          <div className="text-xs text-och-steel-grey mt-1">Click generate to create this report</div>
        </CardContent>
      </CardEnhanced>
    );
  }

  return (
    <CardEnhanced className="hover:shadow-lg hover:shadow-och-defender-blue/10 transition-all duration-200 group">
      <CardContent className="p-4 relative">
        {/* Badge */}
        {badge && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-och-signal-orange to-och-sahara-gold text-black font-medium">
            {badge}
          </Badge>
        )}

        {/* Header with type icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-lg">{getTypeIcon(report.type)}</div>
            <div>
              <div className="font-bold text-sm text-white">{report.title}</div>
              <div className="text-xs text-och-steel-grey">
                {report.generatedAt ? new Date(report.generatedAt).toLocaleTimeString() : 'LIVE'}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Preview */}
        {report.metrics && (
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            {report.metrics.readiness && (
              <div className="bg-och-cyber-mint/10 rounded px-2 py-1">
                <div className="text-och-cyber-mint font-medium">{report.metrics.readiness}%</div>
                <div className="text-och-steel-grey">Readiness</div>
              </div>
            )}
            {report.metrics.cohortAvg && (
              <div className="bg-och-signal-orange/10 rounded px-2 py-1">
                <div className="text-och-signal-orange font-medium">{report.metrics.cohortAvg}%</div>
                <div className="text-och-steel-grey">Cohort Avg</div>
              </div>
            )}
            {report.metrics.mttr && (
              <div className="bg-och-sahara-gold/10 rounded px-2 py-1">
                <div className="text-och-sahara-gold font-medium">{report.metrics.mttr}min</div>
                <div className="text-och-steel-grey">MTTR</div>
              </div>
            )}
            {report.metrics.accuracy && (
              <div className="bg-och-defender-blue/10 rounded px-2 py-1">
                <div className="text-och-defender-blue font-medium">{report.metrics.accuracy}%</div>
                <div className="text-och-steel-grey">Accuracy</div>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(report.status)}`} />
          <span className={`text-xs capitalize ${getStatusColor(report.status)}`}>
            {report.status}
          </span>
          {report.size && (
            <span className="text-xs text-och-steel-grey">• {report.size}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1">
          {actions.map((action, i) => (
            <Button
              key={i}
              size="sm"
              variant={action.variant || "outline"}
              className={`h-8 px-3 text-xs flex-1 group-hover:bg-och-defender-blue/10 transition-colors ${
                action.variant === 'primary'
                  ? 'bg-och-defender-blue hover:bg-och-defender-blue/90 border-och-defender-blue'
                  : ''
              }`}
              onClick={action.onClick}
              disabled={report.status === 'generating'}
            >
              <action.icon className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </CardEnhanced>
  );
};
