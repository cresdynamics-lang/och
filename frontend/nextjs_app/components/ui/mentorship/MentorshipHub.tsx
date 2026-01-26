/**
 * Redesigned Mentorship Hub
 * Implements the MMM (Mentorship Management Module)
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Target, 
  MessageSquare, 
  History,
  TrendingUp,
  Shield,
  Zap,
  ArrowUpRight,
  Clock,
  Plus,
  Search,
  Filter,
  Star,
  ExternalLink,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MentorProfileCard } from './MentorProfileCard';
import { SchedulingHub } from './SchedulingHub';
import { GoalsTracker } from './GoalsTracker';
import { SessionHistory } from './SessionHistory';
import { MentorshipMessaging } from './MentorshipMessaging'
import { useAuth } from '@/hooks/useAuth';
import { useMentorship } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function MentorshipHub() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { 
    mentor, 
    sessions, 
    goals, 
    isLoading, 
    refetchAll 
  } = useMentorship(userId);

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'goals' | 'chat'>('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-och-steel animate-pulse font-black tracking-widest text-[10px]">Syncing MMM Telemetry...</p>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      
      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
         {[
           {
             label: 'Your Mentor',
             value: mentor?.name || 'Not Assigned',
             sub: mentor?.cohort_name ? `${mentor.cohort_name}${mentor.mentor_role ? ` • ${mentor.mentor_role}` : ''}` : (mentor?.track || 'Contact Director'),
             icon: Users,
             gradient: 'from-och-gold/10 to-och-gold/5',
             border: 'border-och-gold/30',
             iconBg: 'bg-och-gold/10',
             iconBorder: 'border-och-gold/20',
             iconColor: 'text-och-gold'
           },
           { 
             label: 'Next Session', 
             value: upcomingSessions.length > 0 ? new Date(upcomingSessions[0].start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not Scheduled', 
             sub: upcomingSessions.length > 0 ? new Date(upcomingSessions[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Schedule a meeting', 
             icon: Calendar, 
             gradient: 'from-emerald-500/10 to-emerald-500/5',
             border: 'border-emerald-500/30',
             iconBg: 'bg-emerald-500/10',
             iconBorder: 'border-emerald-500/20',
             iconColor: 'text-emerald-400'
           },
           { 
             label: 'Goals Progress', 
             value: `${goals.filter(g => g.status === 'verified').length}/${goals.length}`, 
             sub: 'Milestones completed', 
             icon: Target, 
             gradient: 'from-blue-500/10 to-blue-500/5',
             border: 'border-blue-500/30',
             iconBg: 'bg-blue-500/10',
             iconBorder: 'border-blue-500/20',
             iconColor: 'text-blue-400'
           },
         ].map((stat, i) => (
           <div key={i} className={clsx(
             "p-4 rounded-xl border bg-gradient-to-br transition-all group cursor-default",
             stat.gradient, stat.border
           )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <div className={clsx(
                  "p-1.5 rounded-lg border transition-transform group-hover:scale-110",
                  stat.iconBg, stat.iconBorder, stat.iconColor
                )}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-0.5 truncate">{stat.value}</h4>
              <p className="text-xs text-slate-400 truncate">{stat.sub}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SIDEBAR */}
        <aside className="lg:col-span-3 space-y-3">
          {/* TAB NAVIGATION */}
          <div className="space-y-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: History, desc: 'Session history' },
              { id: 'sessions', label: 'Sessions', icon: CalendarDays, desc: 'Schedule meetings' },
              { id: 'goals', label: 'Goals', icon: Target, desc: 'Track milestones' },
              { id: 'chat', label: 'Messages', icon: MessageSquare, desc: 'Chat with mentor' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left border",
                  activeTab === item.id 
                    ? "bg-gradient-to-r from-och-gold to-och-gold/80 text-black border-och-gold shadow-md" 
                    : "bg-och-midnight/40 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-och-midnight/60"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{item.label}</div>
                  <div className={clsx(
                    "text-xs truncate",
                    activeTab === item.id ? "text-black/70" : "text-slate-500"
                  )}>{item.desc}</div>
                </div>
                {activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* MENTOR PROFILE CARD */}
          {mentor && (
            <div className="mt-4">
              <MentorProfileCard mentor={mentor} />
            </div>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[500px]"
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Session History</h2>
                    <Button variant="outline" size="sm" className="text-xs font-medium border-slate-700">
                      Export Report
                    </Button>
                  </div>
                  <SessionHistory sessions={sessions} />
                </div>
              )}
              
              {activeTab === 'sessions' && (
                <SchedulingHub sessions={sessions} />
              )}
              
              {activeTab === 'goals' && (
                <GoalsTracker 
                  goals={goals} 
                  onGoalCreated={() => {
                    refetchAll();
                  }}
                />
              )}
              
              {activeTab === 'chat' && (
                <MentorshipMessaging />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


