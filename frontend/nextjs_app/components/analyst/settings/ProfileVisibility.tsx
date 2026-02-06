'use client';

import { Switch } from '@/components/ui/Switch';
import { Eye, TrendingUp } from 'lucide-react';

interface ProfileVisibilityProps {
  visibility: {
    publicPortfolio: boolean;
    viewsThisWeek: number;
    readinessScore: boolean;
    missionSubmissions: 'private' | 'mentors' | 'all';
  };
  userId: string;
  onUpdate: (updates: any) => Promise<void>;
}

export const ProfileVisibility = ({ visibility, userId, onUpdate }: ProfileVisibilityProps) => {
  const handleToggle = async (field: string, value: boolean) => {
    await onUpdate({ [field]: value });
  };

  const handleMissionSubmissions = async (value: 'private' | 'mentors' | 'all') => {
    await onUpdate({ missionSubmissions: value });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Eye className="w-5 h-5 text-och-defender-blue" />
        Profile Visibility
      </h4>

      {/* Public Portfolio */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div className="flex-1">
          <div className="font-medium">Public Portfolio</div>
          <div className="text-sm text-och-steel-grey mt-1 flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            {visibility.viewsThisWeek} employer views this week
          </div>
        </div>
        <Switch
          checked={visibility.publicPortfolio}
          onCheckedChange={(enabled) => handleToggle('publicPortfolio', enabled)}
        />
      </div>

      {/* Readiness Score */}
      <div className="flex items-center justify-between p-4 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg">
        <div>
          <div className="font-medium">Share Readiness Score</div>
          <div className="text-sm text-och-steel-grey mt-1">
            Allow employers to see your readiness percentage
          </div>
        </div>
        <Switch
          checked={visibility.readinessScore}
          onCheckedChange={(enabled) => handleToggle('readinessScore', enabled)}
        />
      </div>

      {/* Mission Submissions */}
      <div>
        <label className="block text-sm font-medium mb-2">Mission Submissions</label>
        <div className="space-y-2">
          {(['private', 'mentors', 'all'] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleMissionSubmissions(option)}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                visibility.missionSubmissions === option
                  ? 'border-och-defender-blue bg-och-defender-blue/20 text-och-defender-blue'
                  : 'border-och-steel-grey/30 bg-och-steel-grey/10 text-och-steel-grey hover:border-och-steel-grey/50'
              }`}
            >
              <div className="font-medium capitalize">{option}</div>
              <div className="text-xs mt-1">
                {option === 'private' && 'Only you can see your submissions'}
                {option === 'mentors' && 'Your mentors can see your submissions'}
                {option === 'all' && 'Everyone can see your submissions'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

