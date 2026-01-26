/**
 * Track Control: Journey Progress
 * Displays current track progress, recommended modules, and journey navigation.
 */

'use client';

import { motion } from 'framer-motion';
import { Compass, ChevronRight, Lock, CheckCircle2, Play, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

export function TrackControl() {
  const modules = [
    { title: 'OCH Orientation', tier: 1, status: 'completed', duration: '2h' },
    { title: 'Cyber Hygiene Essentials', tier: 1, status: 'completed', duration: '4h' },
    { title: 'Defender Foundations', tier: 2, status: 'active', duration: '8h' },
    { title: 'Network Security Ops', tier: 2, status: 'locked', duration: '12h' },
  ];

  return (
    <Card className="p-8 rounded-[3rem] bg-och-steel/5 border border-white/5 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-och-gold/10 text-och-gold">
               <Compass className="w-6 h-6" />
            </div>
            <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight">Defender Track Progress</h3>
               <p className="text-och-steel text-[10px] font-black uppercase tracking-widest mt-1">Alignment: High Engagement</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="text-right">
               <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Current Tier</p>
               <p className="text-xl font-black text-och-gold leading-none uppercase">Tier 02</p>
            </div>
            <div className="w-px h-10 bg-och-steel/10" />
            <div className="text-right">
               <p className="text-[9px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">Overall</p>
               <p className="text-xl font-black text-white leading-none">34%</p>
            </div>
         </div>
      </div>

      {/* MODULE TIMELINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {modules.map((mod, i) => (
           <div 
             key={i}
             className={clsx(
               "p-5 rounded-2xl border transition-all relative group cursor-pointer",
               mod.status === 'completed' ? "bg-och-mint/5 border-och-mint/10 opacity-70" : 
               mod.status === 'active' ? "bg-och-gold/5 border-och-gold/30 ring-1 ring-och-gold/20" : 
               "bg-white/5 border-white/5 grayscale opacity-40"
             )}
           >
              <div className="flex justify-between items-start mb-4">
                 <Badge 
                   variant={mod.status === 'completed' ? 'mint' : (mod.status === 'active' ? 'gold' : 'steel')}
                   className="text-[7px] font-black uppercase px-1.5 h-4"
                 >
                    Tier 0{mod.tier}
                 </Badge>
                 {mod.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5 text-och-mint" /> : 
                  mod.status === 'locked' ? <Lock className="w-3.5 h-3.5 text-och-steel" /> : 
                  <Play className="w-3.5 h-3.5 text-och-gold animate-pulse" />}
              </div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-tight leading-tight mb-2 group-hover:text-och-gold transition-colors">{mod.title}</h4>
              <p className="text-[9px] text-och-steel font-medium flex items-center gap-1.5 uppercase tracking-widest">
                 Est: {mod.duration}
              </p>

              {mod.status === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-och-gold/20 rounded-b-2xl overflow-hidden">
                   <div className="h-full w-1/2 bg-och-gold" />
                </div>
              )}
           </div>
         ))}
      </div>

      <div className="flex items-center justify-between pt-4">
         <div className="flex items-center gap-2 p-2 px-4 rounded-xl bg-och-gold/5 border border-och-gold/10">
            <Info className="w-3.5 h-3.5 text-och-gold" />
            <p className="text-[9px] text-och-gold font-black uppercase tracking-widest">System Recommended: Foundations Review</p>
         </div>
         <Button variant="outline" className="text-och-steel hover:text-white text-[10px] font-black uppercase tracking-widest group">
            Full Curriculum View
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
         </Button>
      </div>
    </Card>
  );
}

