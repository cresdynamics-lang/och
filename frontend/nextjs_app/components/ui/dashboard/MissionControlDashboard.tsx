/**
 * Redesigned Student Dashboard: Mission Control
 * Guides students from curiosity to employability through an interactive, mobile-first experience.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Target, 
  TrendingUp, 
  History, 
  MessageSquare,
  Users,
  Bell,
  Search,
  LayoutGrid,
  List,
  Compass,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Star,
  Globe,
  School,
  Radar,
  Activity,
  User,
  ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStore } from '@/app/dashboard/student/lib/store/dashboardStore';
import { ActionCenter } from './components/ActionCenter';
import { HabitEngine } from './components/HabitEngine';
import { MissionCockpit } from './components/MissionCockpit';
import { TalentScopeRadar } from './components/TalentScopeRadar';
import { TrackControl } from './components/TrackControl';
import { CommunityFeed } from './components/CommunityFeed';
import { ActionCenter as NotificationCenter } from './components/ActionCenter';
import clsx from 'clsx';

export function MissionControlDashboard() {
  const { user } = useAuth();
  const { readiness, quickStats, cohortProgress, aiCoachNudge } = useDashboardStore();
  const [feedType, setFeedType] = useState<'university' | 'global'>('university');

  return (
    <div className="min-h-screen bg-och-midnight text-slate-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. FLIGHT HEADER & STATUS BAR */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-och-gold/20 to-transparent border border-och-gold/20 flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-och-gold/10 animate-pulse" />
               <Compass className="w-8 h-8 text-och-gold relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mission Control</h1>
                <Badge variant="defender" className="text-[10px] font-black tracking-widest px-2 py-0.5 uppercase">
                  v4.0 Pilot
                </Badge>
              </div>
              <p className="text-och-steel text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-och-mint animate-pulse" />
                Active Transformation Protocol
              </p>
            </div>
          </div>

          {/* TELEMETRY QUICK STATS */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
             {[
               { label: 'Readiness', value: readiness?.score || 0, icon: Radar, color: 'text-och-mint' },
               { label: 'O-Points', value: quickStats?.points || 0, icon: Zap, color: 'text-och-gold' },
               { label: 'Streak', value: quickStats?.streak || 0, icon: Flame, color: 'text-och-defender' },
             ].map((stat, i) => (
               <div key={i} className="flex-1 min-w-[120px] px-5 py-3 rounded-2xl bg-och-steel/5 border border-och-steel/10 flex items-center gap-3 hover:border-white/10 transition-all">
                  <stat.icon className={clsx("w-4 h-4", stat.color)} />
                  <div>
                    <p className="text-[8px] text-och-steel font-black uppercase tracking-widest mb-0.5">{stat.label}</p>
                    <p className="text-lg font-black text-white leading-none">{stat.value}</p>
                  </div>
               </div>
             ))}
             <NotificationCenter nudge={aiCoachNudge} />
          </div>
        </header>

        {/* 2. MAIN COCKPIT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* LEFT COLUMN: GUIDANCE & OPS */}
           <div className="lg:col-span-8 space-y-8">
              
              {/* ACTION CENTER: "WHAT TO DO NEXT" */}
              <ActionCenter nudge={aiCoachNudge} />

              {/* MISSION COCKPIT: ACTIVE OPERATION */}
              <MissionCockpit progress={cohortProgress} />

              {/* TRACK CONTROL: JOURNEY PROGRESS */}
              <TrackControl />

              {/* COMMUNITY FEED: GLOBAL VS LOCAL */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <button 
                         onClick={() => setFeedType('university')}
                         className={clsx(
                           "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all pb-2 border-b-2",
                           feedType === 'university' ? "border-och-gold text-white" : "border-transparent text-och-steel hover:text-white"
                         )}
                       >
                         <School className="w-4 h-4" />
                         University Feed
                       </button>
                       <button 
                         onClick={() => setFeedType('global')}
                         className={clsx(
                           "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all pb-2 border-b-2",
                           feedType === 'global' ? "border-och-mint text-white" : "border-transparent text-och-steel hover:text-white"
                         )}
                       >
                         <Globe className="w-4 h-4" />
                         Global Intelligence
                       </button>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest border-och-steel/20">
                       Publish Intel
                    </Button>
                 </div>
                 <CommunityFeed type={feedType} />
              </div>
           </div>

           {/* RIGHT COLUMN: ANALYTICS & HABITS */}
           <aside className="lg:col-span-4 space-y-8">
              
              {/* TALENTSCOPE RADAR: ANALYTICS HUB */}
              <TalentScopeRadar />

              {/* HABIT ENGINE: DAILY LOGS */}
              <HabitEngine />

              {/* PORTFOLIO SNAPSHOT */}
              <Card className="p-6 rounded-[2rem] bg-gradient-to-br from-och-gold/10 to-transparent border border-och-gold/20 group cursor-pointer overflow-hidden">
                 <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Activity className="w-32 h-32 text-och-gold" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                       <Badge variant="gold" className="text-[8px] font-black tracking-widest px-2 py-0.5 uppercase">Portfolio Health</Badge>
                       <ExternalLink className="w-4 h-4 text-och-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-sm font-black text-white mb-2 uppercase tracking-tight leading-none">Public Identity</h4>
                    <p className="text-[10px] text-och-steel font-medium italic mb-6">"Your profile is 84% ready for employer scouting."</p>
                    <div className="flex items-center gap-4">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                             <div key={i} className="w-8 h-8 rounded-full bg-och-midnight border-2 border-och-gold/30 flex items-center justify-center text-[10px] font-black text-och-gold">
                                <Shield className="w-3.5 h-3.5" />
                             </div>
                          ))}
                       </div>
                       <p className="text-[10px] text-och-gold font-black uppercase tracking-widest">3 Featured Outcomes</p>
                    </div>
                 </div>
              </Card>

              {/* MENTOR NOTES (PROFESSIONAL TIER) */}
              <div className="p-6 rounded-[2rem] bg-och-steel/5 border border-white/5 space-y-4">
                 <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-och-mint" />
                    <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Latest Mentor Debrief</span>
                 </div>
                 <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                       "Strong progress on technical labs. Focus more on documenting your decision-making process in the next mission report."
                    </p>
                    <div className="flex items-center justify-between mt-4">
                       <span className="text-[9px] font-black text-och-mint uppercase tracking-widest">Verified by Alex</span>
                       <span className="text-[9px] text-och-steel">2h ago</span>
                    </div>
                 </div>
              </div>

           </aside>
        </div>
      </div>
    </div>
  );
}

