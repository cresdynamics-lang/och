'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Download, CheckCircle2, Clock, Briefcase } from 'lucide-react';
import { CareerFunnel } from './CareerFunnel';
import { CareerMatchesList } from './CareerMatchesList';
import { AutoResumeGenerator } from './AutoResumeGenerator';
import type { CareerPipeline } from '@/types/analyst-career';

interface CareerPipelinePanelProps {
  career: CareerPipeline;
  userId: string;
  onUpdate?: () => void;
}

export const CareerPipelinePanel = ({ career, userId, onUpdate }: CareerPipelinePanelProps) => {
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
        <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2 mb-2">
          🎯 CAREER
        </h3>
        <div className="text-xs text-och-steel-grey uppercase tracking-wider">
          SOC Job Pipeline
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
        <CareerFunnel pipeline={career.pipeline} />
      </div>

      {/* Portfolio Analytics */}
      <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0 bg-och-cyber-mint/5">
        <div className="flex items-center gap-2 text-xs text-och-sahara-gold mb-3 uppercase tracking-wider">
          <Briefcase className="w-4 h-4" />
          <span>PORTFOLIO ANALYTICS</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-och-cyber-mint">
              {career.portfolio.viewsThisWeek}
            </div>
            <div className="text-xs text-och-steel-grey mt-1">views/wk</div>
            {career.portfolio.weeklyGrowth > 0 && (
              <div className="text-xs text-och-cyber-mint font-medium mt-1">
                +{career.portfolio.weeklyGrowth} today
              </div>
            )}
          </div>
          <div className="text-center border-l border-och-steel-grey/30 pl-3">
            <div className="text-lg font-bold text-och-cyber-mint">
              {career.portfolio.employerViews}
            </div>
            <div className="text-xs text-och-steel-grey mt-1">Employer</div>
          </div>
          <div className="text-center border-l border-och-steel-grey/30 pl-3">
            <div className="text-lg font-bold text-och-cyber-mint">
              {career.portfolio.totalViews}
            </div>
            <div className="text-xs text-och-steel-grey mt-1">Total</div>
          </div>
        </div>
      </div>

      {/* Career Matches */}
      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <CareerMatchesList
          matches={career.matches}
          userId={userId}
          onApply={() => onUpdate?.()}
        />
      </div>

      {/* Resume Generator */}
      <div className="p-4 border-t border-och-steel-grey/50 flex-shrink-0">
        <AutoResumeGenerator
          userId={userId}
          readinessBadge={career.readinessBadge}
          resumeUrl={career.resumeUrl}
          resumeExpiry={career.resumeExpiry}
          onGenerate={() => onUpdate?.()}
        />
      </div>
    </div>
  );
};

