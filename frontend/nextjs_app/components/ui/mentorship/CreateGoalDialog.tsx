/**
 * Create Goal Dialog
 * Dialog for creating new mentorship goals
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { apiGateway } from '@/services/apiGateway';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateGoalDialog({ open, onOpenChange, onSuccess }: CreateGoalDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'monthly' as 'daily' | 'weekly' | 'monthly',
    target: 1,
    due_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        target: formData.target,
        current: 0,
        progress: 0,
        status: 'active',
        due_date: formData.due_date || null,
      };

      await apiGateway.post('/coaching/goals', payload);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'monthly',
        target: 1,
        due_date: '',
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      setError(err?.data?.detail || err?.message || 'Failed to create goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-och-midnight border-och-steel/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-black uppercase tracking-tighter">
            Create New Goal
          </DialogTitle>
          <DialogDescription className="text-och-steel">
            Set a SMART goal aligned with your mentorship journey
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-signal-orange/25 border border-signal-orange text-white px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Goal Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                placeholder="e.g., Master MITRE ATT&CK Mapping"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold min-h-[100px]"
                placeholder="Describe what you want to achieve and how you'll measure success..."
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Goal Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                  required
                  disabled={isSubmitting}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Target Value *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                  placeholder="1"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="defender"
              disabled={isSubmitting}
              className="bg-och-gold text-black hover:bg-white font-black uppercase tracking-widest"
            >
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

