/**
 * Redesigned Portfolio Skills Radar Component
 * Interactive radar chart visualization of skill mastery
 * Follows the OCH dark theme and TalentScope aesthetic.
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Target, Hexagon, Zap } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillData {
  name: string;
  score: number;
}

interface PortfolioSkillsRadarProps {
  skills: Array<{ skill: string; score: number; count: number }>;
}

export function PortfolioSkillsRadar({ skills }: PortfolioSkillsRadarProps) {
  // Normalize skills data - handle both string arrays and object arrays
  const normalizedSkills = (skills || []).map((skill: any) => {
    // If it's a string, convert to object format
    if (typeof skill === 'string') {
      return {
        skill: skill,
        score: 5, // Default score
        count: 1, // Default count
      };
    }
    // If it's already an object, ensure all fields exist
    return {
      skill: skill.skill || skill.name || '',
      score: skill.score || 5,
      count: skill.count || 1,
    };
  }).filter((skill: any) => skill.skill && skill.skill.trim() !== ''); // Filter out empty skills

  // Transform skills data for radar chart
  const radarData = normalizedSkills
    .slice(0, 8) // Top 8 skills for readability
    .map((skill) => ({
      name: skill.skill.length > 12 ? skill.skill.substring(0, 12) + '...' : skill.skill,
      fullName: skill.skill,
      score: Math.min(100, (skill.score || 5) * 10), // Scale 0-10 to 0-100
      count: skill.count || 1,
    }));

  // If no skills, show empty state
  if (radarData.length === 0) {
    return (
      <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem]">
        <div className="p-12 text-center">
          <Target className="w-16 h-16 text-och-steel/30 mx-auto mb-6" />
          <h3 className="font-black text-xl text-white uppercase tracking-tighter mb-2">TalentScope Radar</h3>
          <p className="text-sm text-och-steel font-medium italic">"Deploy missions to generate skill telemetry and calibrate your radar."</p>
        </div>
      </Card>
    );
  }

  const avgMastery = Math.round(radarData.reduce((sum, s) => sum + s.score, 0) / radarData.length) || 0;

  return (
    <Card className="bg-och-midnight/60 border border-och-steel/10 rounded-[2.5rem] backdrop-blur-xl overflow-hidden relative group">
      {/* WATERMARK */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
         <Hexagon className="w-48 h-48 text-och-mint" />
      </div>

      <div className="p-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-och-mint/10 text-och-mint border border-och-mint/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white uppercase tracking-tighter leading-none mb-1">Skills Mastery</h3>
              <p className="text-[10px] text-och-steel font-black uppercase tracking-widest">TalentScope Analytics Engine</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-och-mint/10 border border-och-mint/20 rounded-full">
             <span className="text-[10px] font-black text-och-mint uppercase tracking-widest">{avgMastery}% AVG</span>
          </div>
        </div>

        <div className="relative h-80 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#334155" strokeWidth={1} />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 } as any}
                tickLine={{ stroke: '#334155' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#475569', fontSize: 8 }}
                tickCount={6}
                axisLine={false}
              />
              <Radar
                name="Mastery"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.15}
                strokeWidth={3}
                animationDuration={1500}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Stats Summary */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-och-steel/10">
          <div className="p-4 rounded-2xl bg-white/5 border border-och-steel/5 flex items-center gap-4">
             <div className="p-2 rounded-lg bg-och-gold/10 text-och-gold">
               <Zap className="w-4 h-4" />
             </div>
             <div>
               <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Items Scanned</p>
               <p className="text-xl font-black text-white leading-none">{skills.reduce((sum, s) => sum + s.count, 0)}</p>
             </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-och-steel/5 flex items-center gap-4">
             <div className="p-2 rounded-lg bg-och-mint/10 text-och-mint">
               <TrendingUpIcon className="w-4 h-4" />
             </div>
             <div>
               <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Diversity Index</p>
               <p className="text-xl font-black text-white leading-none">{skills.length}</p>
             </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
