/**
 * Redesigned Mentorship Hub
 * Implements the MMM (Mentorship Management Module)
 */

'use client';

import { useState, useMemo } from 'react';
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
import { useMentorship, type StudentMentorAssignment } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function MentorshipHub() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { 
    mentor, 
    sessions, 
    goals, 
    assignments,
    isLoading, 
    refetchAll 
  } = useMentorship(userId);

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'goals' | 'chat'>('overview');
  // Use a UI key (uiId) so that the same mentor+student pair can appear once per cohort.
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState<string | 'all'>('all');
  // Separate selection for the active chat thread (per mentor/cohort assignment)
  const [selectedChatKey, setSelectedChatKey] = useState<string | null>(null);

  const activeAssignment: StudentMentorAssignment | null = useMemo(() => {
    if (!assignments || assignments.length === 0) return null;
    if (selectedAssignmentKey === 'all') return null;
    return assignments.find(a => a.uiId === selectedAssignmentKey) || null;
  }, [assignments, selectedAssignmentKey]);

  // Determine which assignments should appear as chat conversations
  const chatAssignments: StudentMentorAssignment[] = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    // If a cohort filter is active, only show mentors for that cohort
    if (activeAssignment?.cohort_id) {
      return assignments.filter(a => a.cohort_id === activeAssignment.cohort_id);
    }
    return assignments;
  }, [assignments, activeAssignment]);

  // Active chat conversation (per mentor)
  const activeChat: StudentMentorAssignment | null = useMemo(() => {
    if (!chatAssignments.length) return null;
    if (selectedChatKey) {
      return chatAssignments.find(a => a.uiId === selectedChatKey) || chatAssignments[0];
    }
    return chatAssignments[0];
  }, [chatAssignments, selectedChatKey]);

  // Count mentors in the current context (all cohorts or a specific cohort filter)
  const mentorCountForContext = useMemo(() => {
    if (!assignments || assignments.length === 0) return 0;
    if (activeAssignment?.cohort_id) {
      return assignments.filter(a => a.cohort_id === activeAssignment.cohort_id).length;
    }
    return assignments.length;
  }, [assignments, activeAssignment]);

  const displayMentorName = activeAssignment?.mentor_name || mentor?.name || 'Not Assigned';
  const displayCohortLabel = useMemo(() => {
    if (activeAssignment) {
      return `${activeAssignment.cohort_name || activeAssignment.cohort_id || 'Cohort'}${
        mentor?.mentor_role ? ` • ${mentor.mentor_role}` : ''
      }`;
    }

    // When multiple cohorts exist, avoid showing a single cohort name to prevent confusion.
    if (assignments && assignments.length > 1) {
      return 'All cohorts';
    }

    // Single assignment: show that cohort explicitly.
    if (assignments && assignments.length === 1) {
      const a = assignments[0];
      return `${a.cohort_name || a.cohort_id || 'Cohort'}${
        mentor?.mentor_role ? ` • ${mentor.mentor_role}` : ''
      }`;
    }

    // Fallback to mentor-level info if no assignments are available.
    if (mentor?.cohort_name) {
      return `${mentor.cohort_name}${mentor.mentor_role ? ` • ${mentor.mentor_role}` : ''}`;
    }

    return mentor?.track || 'Contact Director';
  }, [activeAssignment, assignments, mentor]);

  const filteredSessions = useMemo(
    () => {
      if (!activeAssignment) return sessions;
      return sessions.filter(s => s.mentor_id === activeAssignment.mentor_id);
    },
    [sessions, activeAssignment]
  );

  const upcomingSessions = filteredSessions.filter(
    s => s.status === 'confirmed' || s.status === 'pending'
  );

  const profileMentor = useMemo(
    () => {
      if (!mentor) return null;
      if (!activeAssignment) return mentor;
      return {
        ...mentor,
        id: activeAssignment.mentor_id,
        name: activeAssignment.mentor_name || mentor.name,
        cohort_name: activeAssignment.cohort_name || mentor.cohort_name,
        assignment_type: 'cohort_based' as const,
      };
    },
    [mentor, activeAssignment]
  );

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

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      
      {/* COHORT & MENTOR FILTER (TOP TOGGLE CARD) */}
      {assignments && assignments.length > 0 && (
        <Card className="border border-och-steel/40 bg-och-midnight/70 px-4 py-3 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-och-steel">
                  Cohorts & Mentors
                </span>
                <span className="text-[11px] text-och-mint font-semibold">
                  {assignments.length} assignment{assignments.length > 1 ? 's' : ''}
                </span>
              </div>
              {activeAssignment && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Viewing: <span className="font-semibold text-white">{activeAssignment.mentor_name}</span>{' '}
                  • Cohort: {activeAssignment.cohort_name || activeAssignment.cohort_id || 'N/A'}
                </p>
              )}
              {!activeAssignment && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Viewing: <span className="font-semibold text-white">All cohorts</span>
                </p>
              )}
            </div>
            <div className="flex-1 md:flex-none">
              <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAssignmentKey('all')}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] border",
                    selectedAssignmentKey === 'all'
                      ? "bg-och-mint/10 border-och-mint text-och-mint"
                      : "bg-och-midnight/60 border-och-steel/40 text-och-steel hover:border-och-mint/40"
                  )}
                >
                  <span className="font-semibold truncate">All Cohorts</span>
                  <span className="text-[9px] uppercase font-black tracking-wide">
                    CLEAR FILTER
                  </span>
                </button>
                {assignments.map((a: StudentMentorAssignment) => (
                  <button
                    key={a.uiId}
                    type="button"
                    onClick={() => setSelectedAssignmentKey(a.uiId)}
                    className={clsx(
                      "inline-flex flex-col items-start rounded-xl px-3 py-1.5 text-[10px] border min-w-[180px] max-w-xs",
                      selectedAssignmentKey === a.uiId
                        ? "bg-och-mint/10 border-och-mint text-white"
                        : "bg-och-midnight/60 border-och-steel/40 text-slate-200 hover:border-och-mint/40"
                    )}
                  >
                    <span className="font-semibold truncate">
                      {a.mentor_name}
                    </span>
                    <span className="text-[9px] text-och-steel truncate">
                      Cohort: {a.cohort_name || a.cohort_id || 'N/A'}
                    </span>
                    {a.assigned_at && (
                      <span className="text-[9px] text-slate-500">
                        Since {new Date(a.assigned_at).toLocaleDateString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
         {[
           {
             label: mentorCountForContext > 1 ? 'Your mentors' : 'Your mentor',
             value:
               mentorCountForContext > 1
                 ? `${mentorCountForContext} mentors`
                 : displayMentorName,
             sub: displayCohortLabel,
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
              { id: 'chat', label: 'Messages', icon: MessageSquare, desc: 'Chat with mentors' },
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

          {/* MENTOR PROFILE CARD (per cohort filter) */}
          {profileMentor && (
            <div className="mt-4">
              <MentorProfileCard mentor={profileMentor} />
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
                  <SessionHistory sessions={filteredSessions} />
                </div>
              )}
              
              {activeTab === 'sessions' && (
                <SchedulingHub sessions={filteredSessions} />
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
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
                  {/* Chat list */}
                  <div className="md:col-span-4 lg:col-span-3">
                    <Card className="h-full bg-och-midnight/60 border border-och-steel/30">
                      <div className="p-4 border-b border-och-steel/20 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-white">Mentor Chats</h3>
                          <p className="text-[11px] text-och-steel">
                            {chatAssignments.length
                              ? `${chatAssignments.length} mentor${chatAssignments.length > 1 ? 's' : ''} available`
                              : 'No mentors available for this cohort'}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 space-y-1 max-h-[420px] overflow-y-auto">
                        {chatAssignments.map((a) => {
                          const isActive = activeChat && a.uiId === activeChat.uiId;
                          return (
                            <button
                              key={a.uiId}
                              type="button"
                              onClick={() => setSelectedChatKey(a.uiId)}
                              className={clsx(
                                'w-full text-left px-3 py-2 rounded-lg border transition-colors',
                                isActive
                                  ? 'border-och-mint bg-och-mint/10'
                                  : 'border-och-steel/30 bg-och-midnight/60 hover:border-och-mint/40'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-white truncate">
                                  {a.mentor_name}
                                </span>
                                <span className="text-[10px] text-och-steel uppercase">
                                  {a.cohort_name || a.cohort_id || 'Cohort'}
                                </span>
                              </div>
                              {a.assigned_at && (
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Since {new Date(a.assigned_at).toLocaleDateString()}
                                </p>
                              )}
                            </button>
                          );
                        })}
                        {!chatAssignments.length && (
                          <p className="text-[12px] text-och-steel px-2 py-3">
                            No mentor conversations yet. Once mentors are assigned to your cohorts,
                            their chats will appear here.
                          </p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Active chat */}
                  <div className="md:col-span-8 lg:col-span-9">
                    {activeChat ? (
                      <MentorshipMessaging
                        assignmentId={activeChat.id}
                        mentorIdOverride={activeChat.mentor_id}
                        mentorNameOverride={activeChat.mentor_name}
                      />
                    ) : (
                      <Card className="h-full flex items-center justify-center bg-och-midnight/60 border border-och-steel/30">
                        <p className="text-och-steel text-sm text-center px-4">
                          Select a mentor on the left to start a conversation.
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


