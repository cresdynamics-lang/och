/**
 * Session History & Feedback System
 * The "single source of truth" for student development.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  FileText, 
  Star, 
  ChevronRight, 
  ChevronDown, 
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Zap,
  Award
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SessionFeedbackForm } from '@/components/student/SessionFeedbackForm';
import { SessionFeedbackView } from '@/components/mentor/SessionFeedbackView';
import type { MentorshipSession } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function SessionHistory({ sessions }: { sessions: MentorshipSession[] }) {
  const completed = sessions.filter(s => s.status === 'completed');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {completed.length > 0 ? (
        completed.map((session) => (
          <div 
            key={session.id}
            className="rounded-[2.5rem] bg-och-steel/5 border border-och-steel/10 overflow-hidden group transition-all"
          >
            {/* Session Summary Bar */}
            <div 
              onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                 <div className="w-14 h-14 rounded-2xl bg-och-midnight border border-och-steel/10 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-och-gold uppercase tracking-tighter leading-none">
                      {new Date(session.start_time).toLocaleDateString([], { month: 'short' })}
                    </span>
                    <span className="text-xl font-black text-white leading-none mt-0.5">
                      {new Date(session.start_time).toLocaleDateString([], { day: 'numeric' })}
                    </span>
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">{session.topic}</h4>
                    <div className="flex items-center gap-3">
                       <p className="text-[10px] text-och-steel font-black uppercase tracking-widest flex items-center gap-1.5">
                         <User className="w-3 h-3" />
                         Mentor Recap Recorded
                       </p>
                       <div className="w-1 h-1 rounded-full bg-och-steel/30" />
                       <p className="text-[10px] text-och-mint font-black uppercase tracking-widest flex items-center gap-1.5">
                         <Star className="w-3 h-3 fill-och-mint" />
                         Feedback Verified
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                 <Badge variant="mint" className="text-[8px] font-black uppercase px-2 h-5">Success</Badge>
                 <div className={clsx(
                   "p-2 rounded-full border border-och-steel/10 transition-transform duration-300",
                   expandedSession === session.id ? "rotate-180" : ""
                 )}>
                   <ChevronDown className="w-4 h-4 text-och-steel" />
                 </div>
              </div>
            </div>

            {/* Session Details (Expanded) */}
            <AnimatePresence>
              {expandedSession === session.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-8 pt-0 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Notes Section */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-och-gold" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Mentor's Structured Notes</span>
                       </div>
                       <div className="p-6 rounded-2xl bg-black/40 border border-white/5 relative">
                          <div className="absolute top-4 right-4 text-och-steel/20">
                             <MessageSquare className="w-12 h-12" />
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed italic mb-6">
                            "{session.notes || 'No notes available for this session.'}"
                          </p>
                          <div className="space-y-3">
                             {[
                               { label: 'Technical Accuracy', score: 5 },
                               { label: 'Behavioral Soft Skills', score: 4 },
                               { label: 'Platform Engagement', score: 5 },
                             ].map((metric, i) => (
                               <div key={i} className="flex justify-between items-center">
                                  <span className="text-[9px] font-black text-och-steel uppercase tracking-widest">{metric.label}</span>
                                  <div className="flex gap-1">
                                     {Array.from({ length: 5 }).map((_, s) => (
                                       <div key={s} className={clsx(
                                         "w-3 h-1 rounded-full",
                                         s < metric.score ? "bg-och-mint" : "bg-white/5"
                                       )} />
                                     ))}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Feedback/Actions Section */}
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <div className="flex items-center gap-2">
                             <Award className="w-4 h-4 text-och-mint" />
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">Next Action Items</span>
                          </div>
                          <div className="space-y-2">
                             {[
                               'Complete Tier 3 Lab 12 by Friday',
                               'Refine SMART goals for Q1 engagement',
                               'Review "Identity Alignment" section in Profile'
                             ].map((action, i) => (
                               <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-och-mint/5 border border-och-mint/10">
                                  <div className="w-2 h-2 rounded-full bg-och-mint" />
                                  <span className="text-[10px] text-white font-bold">{action}</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="p-6 rounded-2xl bg-gradient-to-br from-och-defender/10 to-transparent border border-och-defender/20">
                          <h5 className="text-[10px] font-black text-och-defender uppercase tracking-widest mb-2">Performance Impact</h5>
                          <p className="text-[9px] text-slate-400 italic mb-4">"This session contributed to a +2.4 increase in your Readiness Score."</p>
                          <Button variant="outline" className="w-full h-10 rounded-xl border-och-defender/30 text-och-defender hover:bg-och-defender hover:text-black font-black uppercase tracking-widest text-[9px]">
                            Download Session PDF
                          </Button>
                       </div>

                       {/* Session Feedback Section */}
                       <div className="space-y-4">
                          <div className="flex items-center gap-2">
                             <Star className="w-4 h-4 text-och-gold" />
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">Session Feedback</span>
                          </div>
                          
                          {submittingFeedback === session.id ? (
                            <SessionFeedbackForm
                              sessionId={session.id}
                              sessionTitle={session.topic || 'Session'}
                              onSubmitted={() => {
                                setSubmittingFeedback(null)
                                // Optionally refresh session data
                              }}
                              onCancel={() => setSubmittingFeedback(null)}
                            />
                          ) : (
                            <div className="space-y-3">
                              <SessionFeedbackView sessionId={session.id} isMentor={false} />
                              <Button
                                variant="defender"
                                size="sm"
                                onClick={() => setSubmittingFeedback(session.id)}
                                className="w-full"
                              >
                                {submittingFeedback === session.id ? 'Cancel' : 'Provide Feedback'}
                              </Button>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      ) : (
        <div className="p-16 text-center rounded-[3rem] border-2 border-dashed border-och-steel/10 flex flex-col items-center justify-center">
           <History className="w-12 h-12 text-och-steel/20 mb-4" />
           <p className="text-och-steel text-xs font-black uppercase tracking-widest">Repository Empty</p>
           <p className="text-[10px] text-slate-500 mt-2 italic max-w-[200px]">"Every professional interaction is a milestone. Your history will be recorded here."</p>
        </div>
      )}
    </div>
  );
}


