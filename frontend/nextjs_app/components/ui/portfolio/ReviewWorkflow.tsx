/**
 * Review Workflow Component
 * Submission → Review → Approval flow
 */

'use client';

import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePortfolio } from '@/hooks/usePortfolio';
import type { PortfolioItem } from '@/lib/portfolio/types';

interface ReviewWorkflowProps {
  item: PortfolioItem;
}

const workflowSteps = [
  { id: 'draft', label: 'Draft', icon: Clock },
  { id: 'submitted', label: 'Submitted', icon: AlertCircle },
  { id: 'in_review', label: 'In Review', icon: Clock },
  { id: 'approved', label: 'Approved', icon: CheckCircle },
  { id: 'published', label: 'Published', icon: CheckCircle },
];

export function ReviewWorkflow({ item }: ReviewWorkflowProps) {
  const { updateItem } = usePortfolio();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = workflowSteps.findIndex((step) => step.id === item.status);
  const currentStep = workflowSteps[currentStepIndex] || workflowSteps[0];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateItem(item.id, { status: 'submitted' });
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = item.status === 'draft';
  const canPublish = item.status === 'approved' && item.visibility !== 'private';

  return (
    <Card className="border-slate-800/50">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Review Workflow</h3>

        {/* Workflow Steps */}
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            {workflowSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isActive
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    } ${isCurrent ? 'ring-4 ring-indigo-500/30' : ''}`}
                  >
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-xs font-medium ${
                        isActive ? 'text-slate-100' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div
                      className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                        index < currentStepIndex ? 'bg-indigo-500' : 'bg-slate-800'
                      }`}
                      style={{
                        left: `${(index + 0.5) * (100 / workflowSteps.length)}%`,
                        width: `${100 / workflowSteps.length}%`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <currentStep.icon className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Current Status: {currentStep.label}
              </div>
              {item.status === 'changes_requested' && (
                <div className="text-xs text-orange-400 mt-1">
                  Changes requested by mentor
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {canSubmit && (
            <Button
              variant="defender"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Submit for Review
            </Button>
          )}

          {item.status === 'changes_requested' && (
            <Button
              variant="outline"
              onClick={() => updateItem(item.id, { status: 'draft' })}
            >
              Make Changes
            </Button>
          )}

          {canPublish && (
            <Button
              variant="mint"
              onClick={() => updateItem(item.id, { status: 'published' })}
            >
              Publish to Profile
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

