/**
 * TalentScope Preview Component - Refactored
 * Circular Readiness Score and Gap Analysis
 */
'use client';

import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';

interface TalentScopePreviewProps {
  readinessScore: number;
  topGaps: string[];
}

export function TalentScopePreview({ readinessScore, topGaps }: TalentScopePreviewProps) {
  // SVG Circle calculations
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (readinessScore / 100) * circumference;

  return (
    <Card className="border-och-steel/20 bg-och-midnight/40 p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-och-mint" />
          <h3 className="font-bold text-white text-xs uppercase tracking-widest">TalentScope</h3>
        </div>
        <div className="flex items-center gap-1 text-och-mint font-bold text-[10px] uppercase cursor-pointer hover:underline">
          Report <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      <div className="flex items-center justify-around mb-8">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-och-steel/10 fill-none"
              strokeWidth="8"
            />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
              cx="48"
              cy="48"
              r={radius}
              className="stroke-och-mint fill-none"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white">{readinessScore}</span>
            <span className="text-[8px] text-och-steel font-bold uppercase">Ready</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-och-mint mb-0.5">
              <TrendingUp className="w-3 h-3" />
              <span className="text-lg font-black">+4.2</span>
            </div>
            <p className="text-[8px] text-och-steel font-bold uppercase">Weekly Gain</p>
          </div>
          <div className="h-px w-full bg-och-steel/10" />
          <div className="text-center">
            <p className="text-lg font-black text-white">Elite</p>
            <p className="text-[8px] text-och-steel font-bold uppercase">Ranking</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-3 h-3 text-och-gold" />
          <span className="text-[10px] text-och-steel uppercase tracking-widest font-bold">Priority Skill Gaps</span>
        </div>
        <div className="space-y-2">
          {topGaps.map((gap, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-och-steel/5 border border-och-steel/10"
            >
              <span className="text-[11px] font-medium text-slate-300">{gap}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(dot => (
                  <div 
                    key={dot}
                    className={`w-1 h-1 rounded-full ${dot <= 3 - idx ? 'bg-och-gold' : 'bg-och-steel/20'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
