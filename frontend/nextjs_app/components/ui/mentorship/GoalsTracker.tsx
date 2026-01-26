/**
 * Goals & Milestones Tracker
 * SMART goal management aligned with Future-You persona.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Clock, 
  Zap, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreateGoalDialog } from './CreateGoalDialog';
import type { SmartGoal } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function GoalsTracker({ goals, onGoalCreated }: { goals: SmartGoal[]; onGoalCreated?: () => void }) {
  const [filter, setFilter] = useState<'all' | 'technical' | 'behavioral' | 'career'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredGoals = goals.filter(g => filter === 'all' || g.category === filter);

  return (
    <div className="space-y-8">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Goals & Milestones</h2>
          <p className="text-och-steel text-xs font-black uppercase tracking-widest mt-1">Lifecycle Tracking: Draft → Verified</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-och-midnight/80 rounded-2xl border border-och-steel/20 p-1 shadow-inner">
             {['all', 'technical', 'behavioral', 'career'].map((f) => (
               <button
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className={clsx(
                   "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                   filter === f ? "bg-och-gold text-black shadow-lg" : "text-och-steel hover:text-white"
                 )}
               >
                 {f}
               </button>
             ))}
           </div>
           <Button 
             variant="defender" 
             size="sm" 
             className="h-10 px-6 rounded-xl bg-och-gold text-black hover:bg-white font-black uppercase tracking-widest text-[9px]"
             onClick={() => setShowCreateDialog(true)}
           >
             <Plus className="w-4 h-4 mr-2" />
             New Goal
           </Button>
        </div>
      </div>

      {/* GOALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredGoals.map((goal) => (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-[2.5rem] bg-och-steel/5 border border-och-steel/10 hover:border-white/10 transition-all group relative overflow-hidden"
            >
              {/* Category Indicator */}
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                {goal.category === 'technical' && <Zap className="w-16 h-16 text-och-gold" />}
                {goal.category === 'behavioral' && <Shield className="w-16 h-16 text-och-mint" />}
                {goal.category === 'career' && <TrendingUp className="w-16 h-16 text-och-defender" />}
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                 <Badge 
                  variant={goal.status === 'verified' ? 'mint' : (goal.status === 'in_progress' ? 'gold' : 'steel')}
                  className="text-[8px] font-black uppercase px-2"
                 >
                   {goal.status}
                 </Badge>
                 <div className="flex items-center gap-1.5 text-och-steel">
                   <Clock className="w-3 h-3" />
                   <span className="text-[9px] font-black uppercase tracking-widest">
                     {new Date(goal.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                   </span>
                 </div>
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 relative z-10">{goal.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-6 relative z-10 italic">
                "{goal.description}"
              </p>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 relative z-10">
                 <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[7px] font-black uppercase tracking-tighter border-och-steel/20 text-och-steel">
                      {goal.alignment} Alignment
                    </Badge>
                 </div>
                 <button className="flex items-center gap-2 text-[9px] font-black text-och-gold uppercase tracking-widest hover:translate-x-1 transition-transform">
                   Manage Progress
                   <ArrowRight className="w-3 h-3" />
                 </button>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: goal.status === 'verified' ? '100%' : (goal.status === 'in_progress' ? '40%' : '10%') }}
                    className={clsx(
                      "h-full transition-all",
                      goal.status === 'verified' ? "bg-och-mint" : "bg-och-gold"
                    )}
                 />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LEGACY / MILESTONES SUMMARY */}
      <Card className="p-8 rounded-[3rem] bg-gradient-to-r from-och-gold/10 to-transparent border border-och-gold/20">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-3xl bg-och-gold/20 border border-och-gold/30 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-och-gold" />
               </div>
               <div>
                 <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Impact Telemetry</h4>
                 <p className="text-xs text-och-steel font-black uppercase tracking-widest leading-relaxed italic max-w-sm">
                   "Your Goal verification rate has improved your Readiness Score by 14 points this month."
                 </p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="text-center px-6 py-4 rounded-2xl bg-black/40 border border-white/5">
                  <p className="text-[9px] text-och-steel font-black uppercase tracking-widest mb-1">Success Rate</p>
                  <p className="text-2xl font-black text-och-mint">88%</p>
               </div>
               <div className="text-center px-6 py-4 rounded-2xl bg-black/40 border border-white/5">
                  <p className="text-[9px] text-och-steel font-black uppercase tracking-widest mb-1">Engagements</p>
                  <p className="text-2xl font-black text-white">24</p>
               </div>
            </div>
         </div>
      </Card>

      {/* Create Goal Dialog */}
      <CreateGoalDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          onGoalCreated?.();
        }}
      />
    </div>
  );
}


