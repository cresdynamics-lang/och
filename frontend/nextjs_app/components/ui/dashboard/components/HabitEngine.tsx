/**
 * Habit Engine: Daily Logs
 * Interactive mobile-first experience to log Learn, Practice, and Reflect habits.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Activity, MessageSquare, CheckCircle2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import clsx from 'clsx';

export function HabitEngine() {
  const [completed, setCompleted] = useState<string[]>(['Learn']);

  const habits = [
    { name: 'Learn', icon: BookOpen, color: 'text-och-mint', bg: 'bg-och-mint/10' },
    { name: 'Practice', icon: Activity, color: 'text-och-gold', bg: 'bg-och-gold/10' },
    { name: 'Reflect', icon: MessageSquare, color: 'text-och-defender', bg: 'bg-och-defender/10' },
  ];

  const toggleHabit = (name: string) => {
    setCompleted(prev => 
      prev.includes(name) ? prev.filter(h => h !== name) : [...prev, name]
    );
  };

  return (
    <Card className="p-6 rounded-[2.5rem] bg-och-steel/5 border border-white/5 space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-och-defender" />
            <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Coaching OS Habits</span>
         </div>
         <Badge variant="defender" className="text-[8px] font-black uppercase px-2">3 Day Streak</Badge>
      </div>

      <div className="space-y-3">
         {habits.map((habit) => {
           const isDone = completed.includes(habit.name);
           return (
             <button
               key={habit.name}
               onClick={() => toggleHabit(habit.name)}
               className={clsx(
                 "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group",
                 isDone 
                  ? "bg-white/10 border-white/20 scale-[0.98]" 
                  : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30"
               )}
             >
               <div className="flex items-center gap-4">
                  <div className={clsx("p-2 rounded-xl transition-colors", habit.bg, habit.color)}>
                     <habit.icon className="w-4 h-4" />
                  </div>
                  <span className={clsx(
                    "text-xs font-black uppercase tracking-widest transition-colors",
                    isDone ? "text-white" : "text-och-steel group-hover:text-white"
                  )}>{habit.name}</span>
               </div>
               <div className={clsx(
                 "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                 isDone ? "bg-och-mint border-och-mint" : "border-och-steel/30"
               )}>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-black" />}
               </div>
             </button>
           );
         })}
      </div>

      <div className="p-4 rounded-2xl bg-och-defender/5 border border-och-defender/10 text-center">
         <p className="text-[9px] text-och-defender font-black uppercase tracking-widest leading-relaxed">
            {completed.length === 3 
              ? "Transformation Threshold Reached for Today!" 
              : `${3 - completed.length} habits remaining to stay aligned.`}
         </p>
      </div>
    </Card>
  );
}

