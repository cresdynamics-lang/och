/**
 * Action Center: "What to do next"
 * Reduces overwhelm by providing clear starting points based on AI guidance.
 */

'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function ActionCenter({ nudge }: { nudge: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-[3rem] bg-gradient-to-r from-och-gold/20 via-och-gold/5 to-transparent border border-och-gold/20 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Zap className="w-32 h-32 text-och-gold" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant="gold" className="text-[10px] font-black tracking-widest px-2 py-0.5 uppercase">AI Navigator</Badge>
          <div className="h-4 w-px bg-och-gold/30" />
          <span className="text-[10px] font-black text-och-gold uppercase tracking-widest flex items-center gap-2">
            <Info className="w-3.5 h-3.5" />
            Priority Task
          </span>
        </div>

        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-tight mb-2 max-w-xl">
            {nudge?.title || "Complete Your Onboarding"}
          </h2>
          <p className="text-sm text-slate-300 font-medium italic max-w-lg leading-relaxed">
            "{nudge?.content || "Before diving into technical operations, you must complete your profile to define your personalized learning blueprint."}"
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
           <Button 
             variant="defender"
             className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-och-gold text-black hover:bg-white transition-all font-black uppercase tracking-widest text-[11px] shadow-lg shadow-och-gold/20 group"
           >
             Initialize Operation
             <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
           </Button>
           <Button 
             variant="outline"
             className="w-full sm:w-auto h-12 px-8 rounded-2xl border-och-gold/20 text-och-gold hover:bg-och-gold/10 transition-all font-black uppercase tracking-widest text-[11px]"
           >
             Analyze Blueprint
           </Button>
        </div>
      </div>
    </motion.div>
  );
}

