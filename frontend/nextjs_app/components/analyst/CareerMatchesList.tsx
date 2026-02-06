'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Clock, Briefcase, ExternalLink } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import type { CareerMatch } from '@/types/analyst-career';

interface CareerMatchesListProps {
  matches: CareerMatch[];
  userId: string;
  onApply?: () => void;
}

export const CareerMatchesList = ({ matches, userId, onApply }: CareerMatchesListProps) => {
  const [applying, setApplying] = useState<string | null>(null);
  const [swipedMatch, setSwipedMatch] = useState<string | null>(null);

  const handleApply = async (matchId: string) => {
    setApplying(matchId);
    try {
      const response = await fetch(`/api/analyst/${userId}/career/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, autoIncludePortfolio: true }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to apply');
      }

      alert(`✅ Application submitted successfully!\n\nYour portfolio and resume have been sent to the employer.`);
      onApply?.();
    } catch (error: any) {
      alert(`❌ Failed to submit application: ${error.message}`);
    } finally {
      setApplying(null);
    }
  };

  const getStatusBadge = (status: CareerMatch['status']) => {
    switch (status) {
      case 'applied':
        return <Badge className="bg-och-defender-blue text-white">Applied ✓</Badge>;
      case 'shortlisted':
        return <Badge className="bg-och-cyber-mint text-black">Shortlisted</Badge>;
      case 'interview':
        return <Badge className="bg-och-sahara-gold text-black">Interview</Badge>;
      case 'offer':
        return <Badge className="bg-och-signal-orange text-white">Offer</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: CareerMatch['status']) => {
    switch (status) {
      case 'applied':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'interview':
        return <Clock className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-white/80 uppercase tracking-wider mb-2 font-medium">
        TOP MATCHES
      </div>
      <div className="grid grid-cols-2 gap-3">
        {matches.map((match) => {
        const isApplying = applying === match.id;
        const canApply = match.status === 'available';
        const isSwiped = swipedMatch === match.id;

        const swipeHandlers = useSwipeGesture({
          onSwipeRight: () => {
            if (canApply) {
              setSwipedMatch(match.id);
              setTimeout(() => {
                handleApply(match.id);
                setSwipedMatch(null);
              }, 300);
            }
          },
          onSwipeLeft: () => {
            // Dismiss/archive action could go here
            setSwipedMatch(match.id);
            setTimeout(() => setSwipedMatch(null), 300);
          },
          threshold: 50,
        });

        return (
          <div
            key={match.id}
            {...swipeHandlers}
            role="article"
            aria-label={`Career match: ${match.company} - ${match.position}`}
            className={`bg-och-steel-grey/20 border border-och-steel-grey/30 rounded-lg p-3 hover:bg-och-steel-grey/30 transition-all focus-within:ring-2 focus-within:ring-och-defender-blue ${
              isSwiped ? 'translate-x-4 opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <div className="font-medium text-xs text-white truncate">{match.company}</div>
                  {getStatusBadge(match.status)}
                </div>
                <div className="text-[10px] text-white/70 truncate">{match.position}</div>
                {match.location && (
                  <div className="text-[10px] text-white/70 mt-0.5 truncate">📍 {match.location}</div>
                )}
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-base font-bold text-och-defender-blue">{match.matchScore}%</div>
                <div className="text-[10px] text-white/70">Match</div>
              </div>
            </div>

            {match.interviewDate && (
              <div className="mb-2 p-1.5 bg-och-sahara-gold/10 border border-och-sahara-gold/30 rounded text-[10px]">
                <div className="flex items-center gap-1 text-och-sahara-gold">
                  <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">
                    {new Date(match.interviewDate).toLocaleDateString()} {new Date(match.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-1.5">
              {canApply && (
                <Button
                  className="flex-1 bg-och-defender-blue hover:bg-och-defender-blue/90 h-8 text-[10px] px-2"
                  onClick={() => handleApply(match.id)}
                  disabled={isApplying}
                >
                  {isApplying ? 'Applying...' : 'Apply'}
                </Button>
              )}
              {match.status === 'interview' && (
                <Button
                  variant="outline"
                  className="flex-1 h-8 text-[10px] px-2"
                  onClick={() => {
                    // Navigate to interview prep
                    console.log('Interview prep for', match.id);
                  }}
                >
                  <ExternalLink className="w-2.5 h-2.5 mr-1" />
                  Prep
                </Button>
              )}
            </div>

            {match.salary && (
              <div className="text-[10px] text-white/70 mt-1.5 truncate">💰 {match.salary}</div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

