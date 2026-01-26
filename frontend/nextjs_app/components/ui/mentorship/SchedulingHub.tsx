/**
 * Scheduling & Calendar Hub (SCH)
 * Time-management backbone for OCH mentorship.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Video,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RequestSessionModal } from './RequestSessionModal';
import type { MentorshipSession } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function SchedulingHub({ sessions }: { sessions: MentorshipSession[] }) {
  const upcoming = sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  const handleGoogleCalendarSync = async () => {
    setIsSyncingCalendar(true);
    try {
      // Redirect to Google OAuth for calendar sync
      const redirectUrl = `${window.location.origin}/api/auth/google/calendar/callback`;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const scope = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Google Calendar sync:', error);
      setIsSyncingCalendar(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Session Scheduling</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage sessions and calendar sync</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleGoogleCalendarSync}
            disabled={isSyncingCalendar}
            className="h-10 px-4 rounded-lg border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 text-sm font-medium transition-all"
          >
            <Globe className="w-4 h-4 mr-1.5" />
            {isSyncingCalendar ? 'Connecting...' : 'Sync Calendar'}
          </Button>
          <Button 
            variant="defender"
            onClick={() => setIsRequestModalOpen(true)}
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-och-gold to-och-gold/80 hover:from-och-gold/90 hover:to-och-gold/70 text-black text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CALENDAR VIEW */}
        <Card className="lg:col-span-7 bg-och-midnight/40 border-slate-700 p-5 rounded-xl">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-och-gold" />
               <span className="text-sm font-semibold text-white">Calendar View</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-400">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-slate-400">Scheduled</span>
                </div>
             </div>
           </div>

           {/* Calendar Integration Placeholder */}
           <div className="flex items-center justify-center min-h-[280px] border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/20">
             <div className="text-center p-6">
               <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
               <p className="text-sm font-semibold text-white mb-1.5">Calendar Integration</p>
               <p className="text-xs text-slate-400 mb-4 max-w-xs">Connect Google Calendar to view availability and sync sessions</p>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleGoogleCalendarSync}
                 disabled={isSyncingCalendar}
                 className="border-och-gold/40 text-och-gold hover:bg-och-gold hover:text-black"
               >
                 <Globe className="w-3.5 h-3.5 mr-1.5" />
                 Connect Calendar
               </Button>
             </div>
           </div>

           <div className="mt-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-slate-300">Timezone: EAT (UTC+3)</span>
              </div>
              <Badge variant="steel" className="text-xs">Not Synced</Badge>
           </div>
        </Card>

        {/* UPCOMING SESSIONS LIST */}
        <div className="lg:col-span-5 space-y-3">
           <div className="flex items-center gap-2 px-1">
             <Clock className="w-4 h-4 text-emerald-400" />
             <span className="text-sm font-semibold text-white">Upcoming Sessions</span>
           </div>

           {upcoming.length > 0 ? (
             upcoming.map((session) => (
               <div key={session.id} className="p-4 rounded-xl bg-och-midnight/60 border border-slate-700 hover:border-slate-600 transition-all">
                 
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex-1 min-w-0 pr-3">
                     <Badge variant={session.status === 'confirmed' ? 'mint' : 'gold'} className="text-xs mb-1.5">
                       {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                     </Badge>
                     <h4 className="text-sm font-semibold text-white truncate">{session.topic}</h4>
                   </div>
                   <div className="text-right shrink-0">
                     <p className="text-sm text-och-gold font-bold">{new Date(session.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                     <p className="text-xs text-slate-400">{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-2 mt-3">
                   {session.meeting_link && (
                     <Button 
                       variant="defender" 
                       size="sm" 
                       className="flex-1 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-xs font-medium"
                       onClick={() => window.open(session.meeting_link, '_blank')}
                     >
                       <Video className="w-3.5 h-3.5 mr-1.5" />
                       Join
                     </Button>
                   )}
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="flex-1 h-9 rounded-lg border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 text-xs font-medium"
                   >
                     Reschedule
                   </Button>
                 </div>
               </div>
             ))
           ) : (
             <div className="p-10 text-center rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center bg-slate-800/20">
                <Calendar className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-white mb-1.5">No upcoming sessions</p>
                <p className="text-xs text-slate-400 max-w-[220px]">Request a session with your mentor to begin</p>
             </div>
           )}
        </div>
      </div>

      {/* Request Session Modal */}
      <RequestSessionModal
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
        onSuccess={() => {
          // Session request submitted successfully
          setIsRequestModalOpen(false);
        }}
      />
    </div>
  );
}


