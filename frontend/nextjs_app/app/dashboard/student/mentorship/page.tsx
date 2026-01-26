/**
 * Redesigned Student Mentorship Page
 * Orchestrates matching, sessions, goals, and feedback.
 */

'use client';

import { Users } from 'lucide-react';
import { MentorshipHub } from '@/components/ui/mentorship/MentorshipHub';

export default function MentorshipPage() {
  return (
    <div className="min-h-screen bg-och-midnight text-slate-200">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        
        {/* PAGE HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-och-gold/20 to-och-gold/5 border border-och-gold/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-och-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mentorship</h1>
              <p className="text-xs text-slate-400">Connect with your mentor and track progress</p>
            </div>
          </div>
        </div>

        {/* MENTORSHIP HUB */}
        <MentorshipHub />

      </div>
    </div>
  );
}
