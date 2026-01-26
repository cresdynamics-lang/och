/**
 * Request Session Modal
 * Dialog for students to request a new mentorship session
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { apiGateway } from '@/services/apiGateway';
import { useMentorship } from '@/hooks/useMentorship';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, MessageSquare, X, AlertCircle } from 'lucide-react';

interface RequestSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RequestSessionModal({ open, onOpenChange, onSuccess }: RequestSessionModalProps) {
  const { user } = useAuth();
  const { scheduleSession, refetchAll } = useMentorship(user?.id?.toString());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preferred_date: '',
    preferred_time: '',
    duration_minutes: 45,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);

  // Generate time slots (9 AM - 5 PM in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 17 && minute === 30) break; // Stop at 5:00 PM
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Please enter a session title');
      return;
    }

    if (!formData.preferred_date) {
      setError('Please select a date');
      return;
    }

    if (!formData.preferred_time) {
      setError('Please select a time');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time into ISO string
      const dateTimeString = `${formData.preferred_date}T${formData.preferred_time}:00`;
      const preferredDateTime = new Date(dateTimeString).toISOString();

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        preferred_date: preferredDateTime,
        duration_minutes: formData.duration_minutes,
        type: 'one_on_one',
      };

      await apiGateway.post('/mentorship/sessions/request', payload);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        preferred_date: '',
        preferred_time: '',
        duration_minutes: 45,
      });
      
      onOpenChange(false);
      onSuccess?.();
      refetchAll();
    } catch (err: any) {
      console.error('Failed to request session:', err);
      setError(err?.data?.detail || err?.data?.error || err?.message || 'Failed to request session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-och-midnight border border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-och-gold/10 border border-och-gold/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-och-gold" />
            </div>
            Request Mentorship Session
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Submit your preferred time and your mentor will review and confirm availability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Session Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight/60 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-och-gold/50 focus:border-och-gold/50 transition-all"
                placeholder="e.g., Career Path Discussion, Portfolio Review"
                required
                disabled={isSubmitting}
                maxLength={100}
              />
              <p className="text-xs text-slate-500 mt-1.5">What would you like to focus on in this session?</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Session Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight/60 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-och-gold/50 focus:border-och-gold/50 transition-all resize-none"
                placeholder="Provide more details about what you'd like to discuss..."
                rows={4}
                disabled={isSubmitting}
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Preferred Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                min={today}
                className="w-full px-4 py-3 bg-och-midnight/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-och-gold/50 focus:border-och-gold/50 transition-all"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Time Selection with Hover */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Preferred Time <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-3 bg-slate-800/30 rounded-xl border border-slate-700">
                {timeSlots.map((time) => {
                  const isSelected = formData.preferred_time === time;
                  const isHovered = hoveredTime === time;
                  
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferred_time: time })}
                      onMouseEnter={() => setHoveredTime(time)}
                      onMouseLeave={() => setHoveredTime(null)}
                      disabled={isSubmitting}
                      className={`
                        px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-och-gold text-black border-2 border-och-gold shadow-lg' 
                          : isHovered
                            ? 'bg-och-gold/20 text-och-gold border-2 border-och-gold/50'
                            : 'bg-och-midnight/60 text-slate-300 border-2 border-slate-700 hover:border-slate-600'
                        }
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">Hover to preview, click to select a time slot (EAT timezone)</p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Session Duration <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[30, 45, 60, 90].map((duration) => {
                  const isSelected = formData.duration_minutes === duration;
                  return (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration_minutes: duration })}
                      disabled={isSubmitting}
                      className={`
                        px-4 py-3 rounded-xl text-sm font-medium transition-all border-2
                        ${isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-och-midnight/60 text-slate-300 border-slate-700 hover:border-slate-600'
                        }
                      `}
                    >
                      {duration} min
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 px-6 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="defender"
              disabled={isSubmitting || !formData.title.trim() || !formData.preferred_date || !formData.preferred_time}
              className="h-11 px-8 bg-gradient-to-r from-och-gold to-och-gold/80 hover:from-och-gold/90 hover:to-och-gold/70 text-black font-bold"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Session
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

