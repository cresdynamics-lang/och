/**
 * Redesigned Portfolio Health Card Component
 * Immersive "TalentScope Analytics" Hero
 * EXACT HERO LAYOUT: PORTFOLIO HEALTH: 87/100 | 12 Items | 8 Approved | 4 Pending | #47 Rank
 */

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Shield, 
  Zap, 
  Target, 
  Hexagon 
} from 'lucide-react';
import clsx from 'clsx';

interface PortfolioHealthCardProps {
  healthScore: number; // 0-100
  totalItems: number;
  approvedItems: number;
  pendingItems: number;
  globalRank: number;
  totalRank: number;
  topSkills: Array<{ skill: string; score: number; count: number }>;
  profileViews: number;
}

export function PortfolioHealthCard({ 
  healthScore, 
  totalItems, 
  approvedItems,
  pendingItems,
  globalRank,
  totalRank,
  topSkills,
  profileViews,
}: PortfolioHealthCardProps) {
  const displaySkills = topSkills.slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-och-midnight to-och-defender/5 border-och-defender/20 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none select-none group-hover:scale-110 transition-transform duration-1000">
        <Hexagon className="w-64 h-64 text-och-defender" />
      </div>

      <div className="p-8 lg:p-12 relative z-10">
        {/* HEADER: PORTFOLIO HEALTH: 87/100 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="defender" className="text-[10px] font-black tracking-widest px-3 py-1 bg-och-defender/20 border border-och-defender/30">
                TALENTSCOPE ENGINE
              </Badge>
              <div className="h-4 w-px bg-och-steel/20" />
              <div className="flex items-center gap-2 text-och-mint text-[10px] font-black uppercase tracking-widest">
                <TrendingUp className="w-3 h-3" />
                Performance: Optimal
              </div>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
              PORTFOLIO HEALTH: <span className="text-och-defender">{healthScore}</span><span className="text-och-steel">/100</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-och-steel uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-och-steel/40" />
                RECAP: {totalItems} ITEMS
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-och-mint" />
                APPROVED: {approvedItems}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-och-gold" />
                PENDING: {pendingItems}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-och-defender" />
                GLOBAL RANK: #{globalRank}/{totalRank}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
             <div className="text-center">
                <p className="text-[9px] text-och-steel font-black uppercase tracking-widest mb-1">Impact Score</p>
                <p className="text-3xl font-black text-white leading-none">A+</p>
             </div>
             <div className="h-10 w-px bg-white/10" />
             <div className="text-center">
                <p className="text-[9px] text-och-steel font-black uppercase tracking-widest mb-1">Profile Views</p>
                <p className="text-3xl font-black text-white leading-none">{profileViews}</p>
             </div>
          </div>
        </div>

        {/* TOP SKILLS: SIEM ████████▁ 92% | Python ██████▁▁ 78% | DFIR ███████ 85% */}
        {displaySkills.length > 0 && (
          <div className="pt-8 border-t border-och-steel/10">
            <div className="flex flex-wrap items-center gap-8 lg:gap-12">
              <span className="text-[10px] font-black text-och-steel uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3 text-och-gold" /> TOP SKILLS TELEMETRY:
              </span>
              
              <div className="flex flex-wrap items-center gap-8">
                {displaySkills.map((skill, index) => {
                  const percentage = Math.round(skill.score * 10);
                  const filledBlocks = Math.floor(percentage / 10);
                  const partialBlock = percentage % 10;
                  const emptyBlocks = 10 - filledBlocks - (partialBlock > 0 ? 1 : 0);
                  
                  return (
                    <div key={skill.skill} className="flex items-center gap-4">
                      <span className="text-xs font-black text-white uppercase tracking-tighter">{skill.skill}</span>
                      <div className="flex items-center gap-0.5 font-mono text-[10px] leading-none">
                        {Array(filledBlocks).fill(0).map((_, i) => (
                          <span key={`filled-${i}`} className="text-och-mint">█</span>
                        ))}
                        {partialBlock > 0 && (
                          <span className="text-och-mint opacity-50">▁</span>
                        )}
                        {Array(emptyBlocks).fill(0).map((_, i) => (
                          <span key={`empty-${i}`} className="text-och-steel/20">▁</span>
                        ))}
                      </div>
                      <span className="text-xs font-black text-och-mint tracking-widest">{percentage}%</span>
                      {index < displaySkills.length - 1 && (
                        <div className="h-3 w-px bg-och-steel/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
