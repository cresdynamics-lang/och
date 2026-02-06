'use client';

import { Briefcase, Eye, UserCheck, MessageSquare, CheckCircle2 } from 'lucide-react';
import type { CareerPipeline } from '@/types/analyst-career';

interface CareerFunnelProps {
  pipeline: CareerPipeline['pipeline'];
}

export const CareerFunnel = ({ pipeline }: CareerFunnelProps) => {
  const stages = [
    {
      label: 'Portfolio Views',
      count: pipeline.portfolioViews,
      icon: Eye,
      bgColor: 'bg-och-defender-blue/20',
      borderColor: 'border-och-defender-blue/50',
      textColor: 'text-och-defender-blue',
      iconBg: 'bg-och-defender-blue/30',
    },
    {
      label: 'Shortlists',
      count: pipeline.shortlists,
      icon: UserCheck,
      bgColor: 'bg-och-cyber-mint/20',
      borderColor: 'border-och-cyber-mint/50',
      textColor: 'text-och-cyber-mint',
      iconBg: 'bg-och-cyber-mint/30',
    },
    {
      label: 'Interviews',
      count: pipeline.interviews,
      icon: MessageSquare,
      bgColor: 'bg-och-sahara-gold/20',
      borderColor: 'border-och-sahara-gold/50',
      textColor: 'text-och-sahara-gold',
      iconBg: 'bg-och-sahara-gold/30',
    },
    {
      label: 'Offers',
      count: pipeline.offers,
      icon: CheckCircle2,
      bgColor: 'bg-och-signal-orange/20',
      borderColor: 'border-och-signal-orange/50',
      textColor: 'text-och-signal-orange',
      iconBg: 'bg-och-signal-orange/30',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="text-xs text-och-steel-grey uppercase tracking-wider mb-2">
        PIPELINE FUNNEL
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.count > 0;

          return (
            <div
              key={stage.label}
              className={`rounded-lg border transition-all ${
                isActive
                  ? `${stage.bgColor} ${stage.borderColor}`
                  : 'bg-och-steel-grey/10 border-och-steel-grey/20'
              }`}
            >
              <div className="p-3 flex flex-col items-center gap-2">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? stage.iconBg : 'bg-och-steel-grey/20'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? stage.textColor : 'text-och-steel-grey'}`} />
                </div>
                
                {/* Count */}
                <div className={`text-2xl font-bold ${isActive ? stage.textColor : 'text-och-steel-grey'}`}>
                  {stage.count}
                </div>
                
                {/* Label */}
                <div className={`text-[10px] text-center font-medium uppercase tracking-wider ${isActive ? 'text-white' : 'text-och-steel-grey'}`}>
                  {stage.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

