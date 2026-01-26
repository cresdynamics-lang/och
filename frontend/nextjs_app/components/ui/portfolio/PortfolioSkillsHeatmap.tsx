/**
 * Portfolio Skills Heatmap Component
 * Radial visualization of skills and competencies
 */

'use client';

import { Card } from '@/components/ui/Card';
// PortfolioHealthMetrics type not needed - using inline props

interface PortfolioSkillsHeatmapProps {
  topSkills: Array<{ skill: string; score: number; count: number }>;
  maxSkills?: number;
}

export function PortfolioSkillsHeatmap({
  topSkills,
  maxSkills = 10,
}: PortfolioSkillsHeatmapProps) {
  const displaySkills = topSkills.slice(0, maxSkills);

  if (displaySkills.length === 0) {
    return (
      <Card className="border-slate-800/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Top Skills</h3>
          <div className="text-sm text-slate-500 italic">No skills data available</div>
        </div>
      </Card>
    );
  }

  const maxScore = Math.max(...displaySkills.map((s) => s.score), 1);

  return (
    <Card className="border-slate-800/50">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Top Skills</h3>
        
        <div className="space-y-4">
          {displaySkills.map((skill, index) => {
            const percentage = (skill.score / maxScore) * 100;
            const intensity = Math.min(100, percentage);
            
            return (
              <div key={skill.skill} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-semibold">
                      {skill.score.toFixed(1)}/10
                    </span>
                    <span className="text-slate-500 text-xs">({skill.count} items)</span>
                  </div>
                </div>
                
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${intensity}%`,
                      opacity: 0.7 + (intensity / 100) * 0.3,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {topSkills.length > maxSkills && (
          <div className="mt-4 text-sm text-slate-500 text-center">
            +{topSkills.length - maxSkills} more skills
          </div>
        )}
      </div>
    </Card>
  );
}

