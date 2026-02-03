'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { CardEnhanced, CardContent } from '@/components/ui/card-enhanced';
import { Clock, MapPin, Building } from 'lucide-react';

interface JobMatch {
  id: string;
  employer: string;
  role: string;
  matchScore: number;
  deadline: string;
  status: 'open' | 'interview' | 'closed';
  tierRequired?: string;
  location?: string;
  salary?: string;
}

interface JobMatchCardProps {
  match: JobMatch;
  onApply: (jobId: string) => void;
  onViewDetails: (jobId: string) => void;
  userTier: string;
  isUrgent?: boolean;
}

export const JobMatchCard: React.FC<JobMatchCardProps> = ({
  match,
  onApply,
  onViewDetails,
  userTier,
  isUrgent = false
}) => {
  const isTierGated = match.tierRequired && userTier !== match.tierRequired;
  const isInterviewUrgent = match.status === 'interview' && new Date(match.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  const getStatusColor = () => {
    switch (match.status) {
      case 'interview': return isInterviewUrgent ? 'text-och-signal-orange' : 'text-och-cyber-mint';
      case 'closed': return 'text-och-steel-grey';
      default: return 'text-och-defender-blue';
    }
  };

  const getStatusText = () => {
    switch (match.status) {
      case 'interview': return isInterviewUrgent ? 'Interview Tomorrow' : 'Interview Scheduled';
      case 'closed': return 'Application Closed';
      default: return 'Apply by ' + new Date(match.deadline).toLocaleDateString();
    }
  };

  const getMatchScoreColor = () => {
    if (match.matchScore >= 90) return 'bg-och-cyber-mint text-black';
    if (match.matchScore >= 75) return 'bg-och-sahara-gold text-black';
    return 'bg-och-steel-grey/50 text-och-steel-grey';
  };

  return (
    <CardEnhanced className={`transition-all duration-200 hover:shadow-lg hover:shadow-och-defender-blue/10 cursor-pointer ${
      isUrgent || isInterviewUrgent ? 'border-och-signal-orange/50 bg-och-signal-orange/5' : ''
    } ${match.status === 'interview' ? 'border-och-cyber-mint/50 bg-och-cyber-mint/5' : ''}`}>

      <CardContent className="p-4" onClick={() => onViewDetails(match.id)}>
        {/* Header with employer and score */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              match.status === 'interview' ? 'bg-och-cyber-mint' :
              isUrgent ? 'bg-och-signal-orange' :
              'bg-och-sahara-gold'
            }`} />
            <div className="flex items-center gap-1">
              <Building className="w-3 h-3 text-och-steel-grey" />
              <span className="font-medium text-sm text-white">{match.employer}</span>
            </div>
          </div>

          <div className={`text-xs font-bold px-2 py-1 rounded-full ${getMatchScoreColor()}`}>
            {match.matchScore}%
          </div>
        </div>

        {/* Role title */}
        <div className="font-medium text-sm text-white mb-2">{match.role}</div>

        {/* Status and deadline */}
        <div className="flex items-center gap-2 text-xs mb-3">
          <Clock className="w-3 h-3 text-och-steel-grey" />
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>

        {/* Location if available */}
        {match.location && (
          <div className="flex items-center gap-1 text-xs text-och-steel-grey mb-3">
            <MapPin className="w-3 h-3" />
            <span>{match.location}</span>
          </div>
        )}

        {/* Salary if available */}
        {match.salary && (
          <div className="text-xs text-och-cyber-mint font-medium mb-3">
            {match.salary}
          </div>
        )}

        {/* Action button */}
        <div onClick={(e) => e.stopPropagation()}>
          {isTierGated ? (
            <Button
              variant="outline"
              className="w-full h-9 text-xs border-och-sahara-gold/50 text-och-sahara-gold hover:bg-och-sahara-gold/10"
              onClick={() => {/* Handle upgrade */}}
            >
              UPGRADE {match.tierRequired?.toUpperCase()}
            </Button>
          ) : (
            <Button
              className={`w-full h-10 text-sm font-bold bg-gradient-to-r ${
                isInterviewUrgent
                  ? 'from-och-signal-orange to-och-sahara-gold hover:from-och-signal-orange/90'
                  : match.status === 'interview'
                  ? 'from-och-cyber-mint to-och-defender-blue hover:from-och-cyber-mint/90'
                  : 'from-och-defender-blue to-och-cyber-mint hover:from-och-defender-blue/90'
              }`}
              onClick={() => onApply(match.id)}
            >
              {isInterviewUrgent ? 'PREP NOW' : match.status === 'interview' ? 'VIEW DETAILS' : 'APPLY 1-CLICK'}
            </Button>
          )}
        </div>
      </CardContent>
    </CardEnhanced>
  );
};
