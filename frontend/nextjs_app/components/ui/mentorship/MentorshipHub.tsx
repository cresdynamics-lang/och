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
import { useMentorship, type StudentMentorAssignment, type MentorAssignmentType } from '@/hooks/useMentorship';
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

  const [activeTab, setActiveTab] = useState<'overview' | 'mentors' | 'sessions' | 'goals' | 'chat'>('overview');
  const [mentorTypeFilter, setMentorTypeFilter] = useState<'all' | MentorAssignmentType>('all');
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState<string | 'all'>('all');
  const [selectedChatKey, setSelectedChatKey] = useState<string | null>(null);

  const assignmentsByType = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    if (mentorTypeFilter === 'all') return assignments;
    return assignments.filter(a => (a.assignment_type || 'cohort') === mentorTypeFilter);
  }, [assignments, mentorTypeFilter]);

  const mentorsByType = useMemo(() => {
    if (!assignments || assignments.length === 0) return { cohort: [], track: [], direct: [] };
    return {
      cohort: assignments.filter(a => (a.assignment_type || 'cohort') === 'cohort'),
      track: assignments.filter(a => a.assignment_type === 'track'),
      direct: assignments.filter(a => a.assignment_type === 'direct'),
    };
  }, [assignments]);

  const activeAssignment: StudentMentorAssignment | null = useMemo(() => {
    if (!assignmentsByType || assignmentsByType.length === 0) return null;
    if (selectedAssignmentKey === 'all') return null;
    return assignmentsByType.find(a => a.uiId === selectedAssignmentKey) || null;
  }, [assignmentsByType, selectedAssignmentKey]);

  const chatAssignments: StudentMentorAssignment[] = useMemo(() => {
    if (!assignmentsByType || assignmentsByType.length === 0) return [];
    if (activeAssignment?.cohort_id) {
      return assignmentsByType.filter(a => a.cohort_id === activeAssignment.cohort_id);
    }
    if (activeAssignment?.track_id) {
      return assignmentsByType.filter(a => a.track_id === activeAssignment.track_id);
    }
    return assignmentsByType;
  }, [assignmentsByType, activeAssignment]);

  // Active chat conversation (per mentor)
  const activeChat: StudentMentorAssignment | null = useMemo(() => {
    if (!chatAssignments.length) return null;
    if (selectedChatKey) {
      return chatAssignments.find(a => a.uiId === selectedChatKey) || chatAssignments[0];
    }
    return chatAssignments[0];
  }, [chatAssignments, selectedChatKey]);

  const mentorCountForContext = useMemo(() => {
    if (!assignmentsByType || assignmentsByType.length === 0) return 0;
    if (activeAssignment?.cohort_id) {
      return assignmentsByType.filter(a => a.cohort_id === activeAssignment.cohort_id).length;
    }
    if (activeAssignment?.track_id) {
      return assignmentsByType.filter(a => a.track_id === activeAssignment.track_id).length;
    }
    return assignmentsByType.length;
  }, [assignmentsByType, activeAssignment]);

  const displayMentorName = activeAssignment?.mentor_name || mentor?.name || 'Not Assigned';
  const displayCohortLabel = useMemo(() => {
    if (activeAssignment) {
      const type = activeAssignment.assignment_type || 'cohort';
      if (type === 'track') {
        return `${activeAssignment.track_name || activeAssignment.track_id || 'Track'}${
          mentor?.mentor_role ? ` • ${mentor.mentor_role}` : ''
        }`;
      }
      if (type === 'direct') return 'Direct assignment';
      return `${activeAssignment.cohort_name || activeAssignment.cohort_id || 'Cohort'}${
        mentor?.mentor_role ? ` • ${mentor.mentor_role}` : ''
      }`;
    }

    if (assignmentsByType && assignmentsByType.length > 1) {
      return mentorTypeFilter === 'all' ? 'All mentors' : `${mentorTypeFilter} mentors`;
    }

    if (assignmentsByType && assignmentsByType.length === 1) {
      const a = assignmentsByType[0];
      const type = a.assignment_type || 'cohort';
      if (type === 'track') return a.track_name || a.track_id || 'Track';
      if (type === 'direct') return 'Direct';
      return `${a.cohort_name || a.cohort_id || 'Cohort'}`;
    }

    if (mentor?.cohort_name) {
      return `${mentor.cohort_name}${mentor.mentor_role ? ` • ${mentor.mentor_role}` : ''}`;
    }

    return mentor?.track || 'Contact Director';
  }, [activeAssignment, assignmentsByType, mentor, mentorTypeFilter]);

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
      
      {/* MENTOR TYPE TABS (sidebar-style filter) */}
      {assignments && assignments.length > 0 && (
        <Card className="border border-och-steel/40 bg-och-midnight/70 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-och-steel">Mentor type</span>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'cohort', 'track', 'direct'] as const).map((type) => {
                const label = type === 'all' ? 'All' : type === 'cohort' ? 'Cohort' : type === 'track' ? 'Track' : 'Direct';
                const count = type === 'all' ? assignments.length : assignments.filter(a => (a.assignment_type || 'cohort') === type).length;
                if (type !== 'all' && count === 0) return null;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setMentorTypeFilter(type);
                      setSelectedAssignmentKey('all');
                    }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      mentorTypeFilter === type
                        ? 'bg-och-mint text-och-midnight'
                        : 'bg-och-midnight/50 text-och-steel hover:text-white border border-och-steel/20'
                    )}
                  >
                    {label} {type !== 'all' && count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-och-steel">
                  {mentorTypeFilter === 'all' ? 'Cohorts & Mentors' : mentorTypeFilter === 'cohort' ? 'Cohort mentors' : mentorTypeFilter === 'track' ? 'Track mentors' : 'Direct mentors'}
                </span>
                <span className="text-[11px] text-och-mint font-semibold">
                  {assignmentsByType.length} assignment{assignmentsByType.length !== 1 ? 's' : ''}
                </span>
              </div>
              {activeAssignment && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Viewing: <span className="font-semibold text-white">{activeAssignment.mentor_name}</span>
                  {activeAssignment.assignment_type === 'track' && ` • Track: ${activeAssignment.track_name || activeAssignment.track_id || 'N/A'}`}
                  {activeAssignment.assignment_type === 'cohort' && ` • Cohort: ${activeAssignment.cohort_name || activeAssignment.cohort_id || 'N/A'}`}
                  {activeAssignment.assignment_type === 'direct' && ' • Direct assignment'}
                </p>
              )}
              {!activeAssignment && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Viewing: <span className="font-semibold text-white">{mentorTypeFilter === 'all' ? 'All mentors' : `${mentorTypeFilter} mentors`}</span>
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
                  <span className="font-semibold truncate">{mentorTypeFilter === 'all' ? 'All' : `All ${mentorTypeFilter}`}</span>
                  <span className="text-[9px] uppercase font-black tracking-wide">CLEAR FILTER</span>
                </button>
                {assignmentsByType.map((a: StudentMentorAssignment) => {
                  const type = a.assignment_type || 'cohort';
                  const scopeLabel = type === 'track' ? `Track: ${a.track_name || a.track_id || 'N/A'}` : type === 'direct' ? 'Direct' : `Cohort: ${a.cohort_name || a.cohort_id || 'N/A'}`;
                  return (
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
                      <span className="font-semibold truncate">{a.mentor_name}</span>
                      <span className="text-[9px] text-och-steel truncate">{scopeLabel}</span>
                      {a.assigned_at && (
                        <span className="text-[9px] text-slate-500">Since {new Date(a.assigned_at).toLocaleDateString()}</span>
                      )}
                    </button>
                  );
                })}
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
              { id: 'mentors', label: 'Mentors', icon: Users, desc: 'By type: Cohort, Track, Direct' },
              { id: 'sessions', label: 'Sessions', icon: CalendarDays, desc: 'Schedule meetings' },
              { id: 'goals', label: 'Goals', icon: Target, desc: 'Track milestones' },
              { id: 'chat', label: 'Messages', icon: MessageSquare, desc: 'Chat with mentors' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as 'overview' | 'mentors' | 'sessions' | 'goals' | 'chat')}
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

              {activeTab === 'mentors' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Your Mentors</h2>
                    <p className="text-sm text-slate-400">Mentors grouped by assignment type</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[
                      { type: 'cohort' as const, label: 'Cohort mentors', list: mentorsByType.cohort, desc: 'Assigned to your cohort' },
                      { type: 'track' as const, label: 'Track mentors', list: mentorsByType.track, desc: 'Assigned to your track' },
                      { type: 'direct' as const, label: 'Direct mentors', list: mentorsByType.direct, desc: 'Assigned directly to you' },
                    ].map(({ type, label, list, desc }) => (
                      <Card key={type} className="border border-och-steel/40 bg-och-midnight/70 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-och-steel/30 bg-och-midnight/50">
                          <h3 className="text-sm font-bold text-white">{label}</h3>
                          <p className="text-[11px] text-och-steel mt-0.5">{desc}</p>
                          <span className="inline-block mt-2 text-[10px] font-semibold text-och-mint uppercase tracking-wider">
                            {list.length} mentor{list.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto">
                          {list.length === 0 ? (
                            <p className="text-xs text-och-steel py-4 text-center">No {type} mentors assigned</p>
                          ) : (
                            list.map((a: StudentMentorAssignment) => {
                              const scope = type === 'track'
                                ? (a.track_name || a.track_id || 'Track')
                                : type === 'direct'
                                  ? 'Direct'
                                  : (a.cohort_name || a.cohort_id || 'Cohort');
                              return (
                                <button
                                  key={a.uiId}
                                  type="button"
                                  onClick={() => {
                                    setMentorTypeFilter(type);
                                    setSelectedAssignmentKey(a.uiId);
                                    setActiveTab('chat');
                                  }}
                                  className={clsx(
                                    'w-full text-left px-3 py-2.5 rounded-xl border transition-all',
                                    'border-och-steel/30 bg-och-midnight/40 hover:border-och-mint/40 hover:bg-och-mint/5'
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-white truncate">{a.mentor_name}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-och-steel shrink-0" />
                                  </div>
                                  <p className="text-[11px] text-och-steel mt-0.5 truncate" title={scope}>
                                    {type === 'cohort' && scope ? `Cohort: ${scope}` : type === 'track' && scope ? `Track: ${scope}` : scope}
                                  </p>
                                  {a.assigned_at && (
                                    <p className="text-[10px] text-slate-500 mt-1">Since {new Date(a.assigned_at).toLocaleDateString()}</p>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
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
                                  {(a.assignment_type || 'cohort') === 'track'
                                    ? (a.track_name || a.track_id || 'Track')
                                    : (a.assignment_type === 'direct' ? 'Direct' : (a.cohort_name || a.cohort_id || 'Cohort'))}
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


