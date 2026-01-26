/**
 * Mission Cockpit: Active Operation
 * Stage-by-stage breakdown of the current mission progress.
 */

'use client';

import { motion } from 'framer-motion';
import { Target, ChevronRight, Shield, Zap, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import clsx from 'clsx';

export function MissionCockpit({ progress }: { progress: any }) {
  const stages = [
    { label: 'Reconnaissance', status: 'completed' },
    { label: 'Infiltration', status: 'active' },
    { label: 'Data Exfiltration', status: 'pending' },
    { label: 'Extraction', status: 'pending' },
  ];

  return (
    <Card className="p-8 rounded-[3rem] bg-och-midnight/80 border border-och-steel/10 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-och-defender/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-och-defender/10 transition-colors" />
      
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-och-defender/10 text-och-defender">
                 <Target className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] text-och-steel font-black uppercase tracking-widest leading-none mb-1.5">Active Operation</p>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">Ransomware Response Simulation</h3>
              </div>
           </div>
           <Button variant="defender" size="sm" className="h-10 px-6 rounded-xl bg-och-defender text-black hover:bg-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-och-defender/20">
              Resume Cockpit
           </Button>
        </div>

        {/* PROGRESS FLOW */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
           <div className="absolute top-6 left-0 right-0 h-0.5 bg-och-steel/10 hidden sm:block" />
           {stages.map((stage, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                 <div className={clsx(
                   "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all mb-4 bg-och-midnight",
                   stage.status === 'completed' ? "border-och-mint bg-och-mint/10 text-och-mint" : 
                   stage.status === 'active' ? "border-och-gold bg-och-gold/10 text-och-gold animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.3)]" : 
                   "border-och-steel/20 text-och-steel"
                 )}>
                    {stage.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                     stage.status === 'active' ? <Zap className="w-6 h-6" /> : 
                     <Circle className="w-6 h-6" />}
                 </div>
                 <p className={clsx(
                   "text-[9px] font-black uppercase tracking-widest leading-tight",
                   stage.status === 'active' ? "text-och-gold" : "text-och-steel"
                 )}>{stage.label}</p>
                 <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Stage 0{i+1}</p>
              </div>
           ))}
        </div>

        {/* TELEMETRY FOOTER */}
        <div className="pt-6 border-t border-white/5 flex flex-wrap gap-6">
           <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-och-defender" />
              <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Evidence: 2/5 Uploaded</span>
           </div>
           <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-och-gold" />
              <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Difficulty: Professional</span>
           </div>
        </div>
      </div>
    </Card>
  );
}

