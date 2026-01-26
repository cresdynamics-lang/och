/**
 * TalentScope Radar: Analytics Hub
 * Real-time "stat sheet" visualization of technical and soft skills.
 */

'use client';

import { motion } from 'framer-motion';
import { Radar, Shield, Zap, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

export function TalentScopeRadar() {
  const metrics = [
    { label: 'Technical Ops', value: 78, color: 'bg-och-gold' },
    { label: 'Behavioral Ready', value: 92, color: 'bg-och-mint' },
    { label: 'Core Security', value: 65, color: 'bg-och-defender' },
    { label: 'Communication', value: 84, color: 'bg-och-gold' },
  ];

  return (
    <Card className="p-6 rounded-[2.5rem] bg-och-midnight border border-och-steel/10 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-och-mint/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-och-mint" />
              <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">TalentScope Analytics</span>
           </div>
           <Badge variant="mint" className="text-[8px] font-black uppercase px-2 tracking-tighter">Live Telemetry</Badge>
        </div>

        {/* MOCK RADAR / HEATMAP VISUAL */}
        <div className="aspect-square w-full bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center relative group-hover:border-och-mint/20 transition-all overflow-hidden">
           <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-3/4 h-3/4 border border-och-mint rounded-full" />
              <div className="w-1/2 h-1/2 border border-och-mint rounded-full" />
              <div className="w-1/4 h-1/4 border border-och-mint rounded-full" />
              <div className="absolute w-px h-full bg-och-mint/20" />
              <div className="absolute w-full h-px bg-och-mint/20" />
           </div>
           
           <div className="relative flex flex-col items-center">
              <span className="text-5xl font-black text-white leading-none">742</span>
              <span className="text-[10px] text-och-mint font-black uppercase tracking-widest mt-2">Readiness Score</span>
           </div>

           {/* Animated Radar Pulse */}
           <div className="absolute inset-0 bg-gradient-to-tr from-och-mint/10 to-transparent animate-spin-slow pointer-events-none" style={{ animationDuration: '8s' }} />
        </div>

        {/* SKILLS BREAKDOWN */}
        <div className="space-y-4 pt-2">
           {metrics.map((metric, i) => (
              <div key={i} className="space-y-2">
                 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-och-steel">{metric.label}</span>
                    <span className="text-white">{metric.value}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={clsx("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]", metric.color)} 
                    />
                 </div>
              </div>
           ))}
        </div>

        <div className="p-4 rounded-2xl bg-och-mint/5 border border-och-mint/10 flex items-center gap-3">
           <TrendingUp className="w-4 h-4 text-och-mint shrink-0" />
           <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
             "Your behavioral readiness is in the 92nd percentile for the 'Defender' archetype."
           </p>
        </div>
      </div>
    </Card>
  );
}

