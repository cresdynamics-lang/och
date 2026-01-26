/**
 * Mentor Profile Card
 * Displays matched mentor information and Future-You alignment.
 */

'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Clock, 
  Zap, 
  Shield, 
  Star,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Mentor } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function MentorProfileCard({ mentor }: { mentor: Mentor }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-[2rem] bg-gradient-to-br from-och-gold/10 to-transparent border border-och-gold/20 relative overflow-hidden group"
    >
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
        <User className="w-32 h-32 text-och-gold" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="gold" className="text-[8px] px-2 py-0.5 font-black tracking-widest uppercase">Assigned Mentor</Badge>
          <div className="flex-1 h-px bg-och-gold/20" />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-och-gold/20 border border-och-gold/30 flex items-center justify-center relative overflow-hidden">
             {mentor.avatar ? (
               <img src={mentor.avatar} alt={mentor.name} className="w-full h-full object-cover" />
             ) : (
               <User className="w-8 h-8 text-och-gold" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div>
            <h4 className="text-xl font-black text-white leading-tight uppercase tracking-tight">{mentor.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="mint" className="text-[7px] font-black uppercase tracking-tighter px-1.5 h-4">Expert</Badge>
              <span className="text-[10px] text-och-steel font-black uppercase tracking-widest">{mentor.track} Track</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-3.5 h-3.5 text-och-steel" />
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">{mentor.timezone}</span>
          </div>
          {mentor.cohort_name && (
            <div className="flex items-center gap-3">
              <Shield className="w-3.5 h-3.5 text-och-defender" />
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">
                Cohort: {mentor.cohort_name}
                {mentor.mentor_role && ` (${mentor.mentor_role})`}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {mentor.expertise.map((skill, i) => (
              <span key={i} className="text-[9px] font-black text-och-gold/80 bg-och-gold/5 px-2 py-0.5 rounded-md border border-och-gold/10">
                {skill}
              </span>
            ))}
            {mentor.assignment_type && (
              <span className="text-[9px] font-black text-och-mint/80 bg-och-mint/5 px-2 py-0.5 rounded-md border border-och-mint/10">
                {mentor.assignment_type === 'cohort_based' ? 'Cohort Assigned' : 'Direct Assignment'}
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed italic mb-6">
          "{mentor.bio}"
        </p>

        <div className="p-4 rounded-2xl bg-black/40 border border-och-steel/10 space-y-3">
           <div className="flex justify-between items-center">
             <span className="text-[8px] font-black text-och-steel uppercase tracking-widest">Alignment Impact</span>
             <span className="text-[10px] font-black text-och-mint">+{mentor.readiness_impact}%</span>
           </div>
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${mentor.readiness_impact}%` }}
               className="h-full bg-gradient-to-r from-och-gold to-och-mint" 
             />
           </div>
           <p className="text-[8px] text-och-steel italic font-medium">"Your technical profile matches mentor's 12-year trajectory."</p>
        </div>
      </div>
    </motion.div>
  );
}


