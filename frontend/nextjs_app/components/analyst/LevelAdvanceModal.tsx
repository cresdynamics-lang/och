'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LevelAdvanceResponse } from '@/types/analyst-content';

interface LevelAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentLevel: number;
  readiness: number;
  onAdvance: () => void;
}

export const LevelAdvanceModal = ({
  isOpen,
  onClose,
  userId,
  currentLevel,
  readiness,
  onAdvance,
}: LevelAdvanceModalProps) => {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdvance = async () => {
    if (readiness < 82) {
      setError('Readiness score must be 82% or higher to advance.');
      return;
    }

    setIsAdvancing(true);
    setError(null);

    try {
      const response = await fetch(`/api/analyst/${userId}/progress/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readiness }),
      });

      const data: LevelAdvanceResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to advance level');
      }

      onAdvance();
    } catch (err: any) {
      setError(err.message || 'Failed to advance level. Please try again.');
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-och-midnight-black border border-och-defender-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-och-defender-blue">
            Advance to Level {currentLevel + 1}
          </h3>
          <button
            onClick={onClose}
            className="text-och-steel-grey hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-och-steel-grey/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {readiness >= 82 ? (
                <CheckCircle2 className="w-5 h-5 text-och-cyber-mint" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-och-signal-orange" />
              )}
              <span className="font-medium">Current Readiness: {readiness}%</span>
            </div>
            <div className="text-sm text-och-steel-grey">
              Required: 82% or higher
            </div>
          </div>

          {readiness >= 82 ? (
            <div className="p-4 bg-och-cyber-mint/10 border border-och-cyber-mint/30 rounded-lg">
              <div className="text-sm text-och-cyber-mint mb-2">
                ✅ You're ready to advance!
              </div>
              <div className="text-xs text-och-steel-grey">
                Unlocking Level {currentLevel + 1} will give you access to advanced recipes and content.
              </div>
            </div>
          ) : (
            <div className="p-4 bg-och-signal-orange/10 border border-och-signal-orange/30 rounded-lg">
              <div className="text-sm text-och-signal-orange mb-2">
                ⚠️ Not ready yet
              </div>
              <div className="text-xs text-och-steel-grey">
                You need {82 - readiness}% more readiness to advance. Complete more videos and quizzes to increase your readiness.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isAdvancing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-och-cyber-mint hover:bg-och-cyber-mint/90 text-black"
              onClick={handleAdvance}
              disabled={isAdvancing || readiness < 82}
            >
              {isAdvancing ? 'Advancing...' : 'Confirm Advance'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

