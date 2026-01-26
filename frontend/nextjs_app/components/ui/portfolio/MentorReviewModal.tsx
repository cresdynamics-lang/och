/**
 * Mentor Review Modal Component
 * Rubric-based scoring interface for portfolio items
 */

'use client';

import { useState } from 'react';
import { X, Star, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EvidenceGallery } from './EvidenceGallery';
import { useMentorReview, useRubric } from '@/hooks/useMentorReview';
import type { PortfolioItem } from '@/lib/portfolio/types';

interface MentorReviewModalProps {
  item: PortfolioItem;
  isOpen: boolean;
  onClose: () => void;
}

export function MentorReviewModal({ item, isOpen, onClose }: MentorReviewModalProps) {
  const { rubric, calculateScore } = useRubric(item);
  const { createReview, isCreating } = useMentorReview(item.id);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'changes_requested'>('pending');

  const totalScore = calculateScore(scores);
  const allCriteriaScored = rubric.criteria.every((c) => scores[c.id] !== undefined);

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores((prev) => ({ ...prev, [criterionId]: value }));
  };

  const handleSubmit = async () => {
    if (!allCriteriaScored) {
      alert('Please score all criteria before submitting');
      return;
    }

    // Create review
    await createReview({
      portfolioItemId: item.id,
      rubricScores: scores,
      comments,
    });

    // Sync with TalentScope API
    try {
      // Map portfolio competency scores to TalentScope format
      const talentscopeScores = Object.entries(scores).reduce((acc, [key, value]) => {
        // Convert rubric criteria to skill names (e.g., "technical" -> "technical_skills")
        const skillName = key.toLowerCase().replace(/\s+/g, '_');
        acc[skillName] = value;
        return acc;
      }, {} as Record<string, number>);

      // Call TalentScope API to sync scores
      const response = await fetch('/api/talentscope/sync-portfolio-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: item.userId,
          portfolioItemId: item.id,
          competencyScores: talentscopeScores,
          totalScore: totalScore,
        }),
      });

      if (!response.ok) {
        console.warn('TalentScope sync failed, but review was saved');
      }
    } catch (error) {
      console.error('Error syncing with TalentScope:', error);
      // Don't block review submission if sync fails
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-indigo-500/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Review: {item.title}</h2>
            <p className="text-sm text-slate-400 mt-1">Type: {item.type}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Evidence */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Evidence</h3>
              <EvidenceGallery files={item.evidenceFiles} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Feedback</h3>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide detailed feedback on the portfolio item..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Review Status</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('approved')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    status === 'approved'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Approve</div>
                </button>
                <button
                  onClick={() => setStatus('changes_requested')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    status === 'changes_requested'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <XCircle className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Request Changes</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Rubric */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Scoring Rubric</h3>
              <div className="space-y-6">
                {rubric.criteria.map((criterion) => {
                  const score = scores[criterion.id] || 5;
                  return (
                    <div key={criterion.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-slate-300">
                          {criterion.name}
                          <span className="text-xs text-slate-500 ml-2">
                            (Weight: {Math.round(criterion.weight * 100)}%)
                          </span>
                        </label>
                        <span className="text-sm font-semibold text-indigo-400">
                          {score.toFixed(1)}/10
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 mb-2">{criterion.description}</p>
                      
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={score}
                        onChange={(e) => handleScoreChange(criterion.id, parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Score */}
            <Card className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border-indigo-500/50">
              <div className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                  <span className="text-3xl font-bold text-emerald-400">
                    {totalScore.toFixed(1)}
                  </span>
                  <span className="text-slate-400">/10</span>
                </div>
                <p className="text-sm text-slate-400">Weighted Total Score</p>
                {!allCriteriaScored && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Please score all criteria
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="defender"
            onClick={handleSubmit}
            disabled={!allCriteriaScored || isCreating}
          >
            {status === 'approved' ? 'Approve & Submit' : 'Request Changes & Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}

