'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TRACK_COLORS } from './CohortStatusBadge';
import {
  Calendar,
  DollarSign,
  Users,
  Target,
  Save,
  X
} from 'lucide-react';

interface NewCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCohort: (cohortData: any) => Promise<void>;
  sponsorSlug: string;
}

const TRACK_OPTIONS = [
  { slug: 'defender', name: 'Defender', description: 'Cybersecurity fundamentals and operations' },
  { slug: 'grc', name: 'GRC', description: 'Governance, Risk & Compliance' },
  { slug: 'innovation', name: 'Innovation', description: 'Cyber tool development and entrepreneurship' },
  { slug: 'leadership', name: 'Leadership', description: 'Technical leadership and management' },
  { slug: 'offensive', name: 'Offensive', description: 'Red teaming and penetration testing' }
];

export function NewCohortModal({ isOpen, onClose, onCreateCohort, sponsorSlug }: NewCohortModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    track_slug: '',
    target_size: 100,
    start_date: '',
    target_completion_date: '',
    budget_allocated: 0,
    placement_goal: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Cohort name is required';
    }

    if (!formData.track_slug) {
      newErrors.track_slug = 'Track selection is required';
    }

    if (formData.target_size < 1) {
      newErrors.target_size = 'Target size must be at least 1';
    }

    if (formData.budget_allocated < 0) {
      newErrors.budget_allocated = 'Budget cannot be negative';
    }

    if (formData.placement_goal < 0) {
      newErrors.placement_goal = 'Placement goal cannot be negative';
    }

    if (formData.start_date && formData.target_completion_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.target_completion_date);
      if (end <= start) {
        newErrors.target_completion_date = 'End date must be after start date';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await onCreateCohort(formData);
      // Reset form
      setFormData({
        name: '',
        track_slug: '',
        target_size: 100,
        start_date: '',
        target_completion_date: '',
        budget_allocated: 0,
        placement_goal: 0
      });
      onClose();
    } catch (error: any) {
      console.error('Error creating cohort:', error);
      setErrors({ submit: error.message || 'Failed to create cohort' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedTrack = TRACK_OPTIONS.find(t => t.slug === formData.track_slug);
  const trackColors = TRACK_COLORS[formData.track_slug as keyof typeof TRACK_COLORS];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Cohort</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {/* Cohort Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
            Cohort Name *
          </label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Jan 2026 - Defender Cohort"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Track Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Track Selection *
          </label>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {TRACK_OPTIONS.map(track => {
              const isSelected = formData.track_slug === track.slug;
              const colors = TRACK_COLORS[track.slug as keyof typeof TRACK_COLORS];

              return (
                <div
                  key={track.slug}
                  onClick={() => handleInputChange('track_slug', track.slug)}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all
                    ${isSelected
                      ? `${colors.border} bg-slate-800`
                      : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold ${isSelected ? colors.text : 'text-white'}`}>
                        {track.name} Track
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">{track.description}</p>
                    </div>
                    {isSelected && (
                      <Badge className={`${colors.bg} ${colors.text}`}>
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.track_slug && <p className="text-red-400 text-sm mt-1">{errors.track_slug}</p>}
        </div>

        {/* Target Size */}
        <div>
          <label htmlFor="target_size" className="block text-sm font-medium text-white mb-2">
            Target Student Size *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="target_size"
              type="number"
              min="1"
              value={formData.target_size}
              onChange={(e) => handleInputChange('target_size', parseInt(e.target.value) || 0)}
              className={`pl-10 ${errors.target_size ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.target_size && <p className="text-red-400 text-sm mt-1">{errors.target_size}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-white mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="target_completion_date" className="block text-sm font-medium text-white mb-2">
              Target Completion Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="target_completion_date"
                type="date"
                value={formData.target_completion_date}
                onChange={(e) => handleInputChange('target_completion_date', e.target.value)}
                className={`pl-10 ${errors.target_completion_date ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.target_completion_date && (
              <p className="text-red-400 text-sm mt-1">{errors.target_completion_date}</p>
            )}
          </div>
        </div>

        {/* Budget and Goals */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget_allocated" className="block text-sm font-medium text-white mb-2">
              Budget Allocated (KES)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="budget_allocated"
                type="number"
                min="0"
                step="1000"
                value={formData.budget_allocated}
                onChange={(e) => handleInputChange('budget_allocated', parseInt(e.target.value) || 0)}
                className={`pl-10 ${errors.budget_allocated ? 'border-red-500' : ''}`}
                placeholder="0"
              />
            </div>
            {errors.budget_allocated && (
              <p className="text-red-400 text-sm mt-1">{errors.budget_allocated}</p>
            )}
          </div>
          <div>
            <label htmlFor="placement_goal" className="block text-sm font-medium text-white mb-2">
              Placement Goal
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="placement_goal"
                type="number"
                min="0"
                value={formData.placement_goal}
                onChange={(e) => handleInputChange('placement_goal', parseInt(e.target.value) || 0)}
                className={`pl-10 ${errors.placement_goal ? 'border-red-500' : ''}`}
                placeholder="0"
              />
            </div>
            {errors.placement_goal && (
              <p className="text-red-400 text-sm mt-1">{errors.placement_goal}</p>
            )}
          </div>
        </div>

        {/* Preview */}
        {selectedTrack && (
          <div className="bg-slate-800 p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Preview</h4>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${trackColors?.bg}`}>
                <span className="text-sm font-medium">🎯</span>
              </div>
              <div>
                <p className="text-white font-medium">{formData.name || 'Cohort Name'}</p>
                <p className="text-slate-400 text-sm">
                  {selectedTrack.name} Track • {formData.target_size} students
                  {formData.placement_goal > 0 && ` • ${formData.placement_goal} placement goal`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 border-slate-600"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Cohort'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
