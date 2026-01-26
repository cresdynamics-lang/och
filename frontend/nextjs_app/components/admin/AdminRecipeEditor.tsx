/**
 * AdminRecipeEditor Component
 *
 * Comprehensive form for creating and editing recipes.
 */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Recipe, RecipeListResponse } from '@/services/types/recipes';

interface AdminRecipeEditorProps {
  recipe?: RecipeListResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeData: Partial<Recipe>) => Promise<void>;
  onPreview?: (recipeData: Partial<Recipe>) => void;
}

const TRACK_OPTIONS = [
  { value: 'defender', label: 'Defender' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'grc', label: 'GRC' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'leadership', label: 'Leadership' },
];

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'mastery', label: 'Mastery' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const SOURCE_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'llm_generated', label: 'LLM Generated' },
  { value: 'external_doc', label: 'External Document' },
  { value: 'lab_platform', label: 'Lab Platform' },
  { value: 'community', label: 'Community' },
];

export function AdminRecipeEditor({
  recipe,
  isOpen,
  onClose,
  onSave,
  onPreview
}: AdminRecipeEditorProps) {
  const [formData, setFormData] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    track_codes: ['defender'],
    skill_codes: [''],
    difficulty: 'beginner',
    estimated_minutes: 20,
    prerequisites: [],
    tools_used: [],
    validation_steps: {},
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load recipe data when editing
  useEffect(() => {
    if (recipe) {
      setFormData({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description || '',
        track_codes: recipe.track_codes || ['defender'],
        skill_codes: recipe.skill_codes || [''],
        level: recipe.level || 'beginner',
        difficulty: recipe.difficulty || 'beginner',
        source_type: recipe.source_type || 'manual',
        expected_duration_minutes: recipe.expected_duration_minutes || 20,
        prerequisites: recipe.prerequisites || [],
        tools_and_environment: recipe.tools_and_environment || [],
        inputs: recipe.inputs || [],
        steps: recipe.steps || [],
        tags: recipe.tags || [],
        validation_checks: recipe.validation_checks || [],
      });
    } else {
      // Reset form for new recipe
      setFormData({
        title: '',
        description: '',
        track_codes: 'defender',
        skill_codes: [''],
        level: 'beginner',
        difficulty: 'beginner',
        source_type: 'manual',
        expected_duration_minutes: 20,
        prerequisites: [],
        tools_and_environment: [],
        inputs: [],
        steps: [],
        tags: [],
        validation_checks: [],
      });
    }
    setErrors({});
  }, [recipe, isOpen]);

  const updateField = (field: keyof Recipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addArrayItem = (field: keyof Recipe, item: string) => {
    if (!item.trim()) return;
    const current = formData[field] as string[] || [];
    updateField(field, [...current, item.trim()]);
  };

  const removeArrayItem = (field: keyof Recipe, index: number) => {
    const current = formData[field] as string[] || [];
    updateField(field, current.filter((_, i) => i !== index));
  };

  const addStep = () => {
    const newStep = {
      step_number: (formData.steps?.length || 0) + 1,
      instruction: '',
      expected_outcome: '',
      evidence_hint: '',
    };
    updateField('steps', [...(formData.steps || []), newStep]);
  };

  const updateStep = (index: number, field: string, value: string) => {
    const steps = [...(formData.steps || [])];
    if (steps[index]) {
      steps[index] = { ...steps[index], [field]: value };
      updateField('steps', steps);
    }
  };

  const removeStep = (index: number) => {
    const steps = (formData.steps || []).filter((_, i) => i !== index);
    // Re-number steps
    const renumberedSteps = steps.map((step, i) => ({
      ...step,
      step_number: i + 1
    }));
    updateField('steps', renumberedSteps);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.skill_codes?.[0]?.trim()) newErrors.skill_codes = 'Skill code is required';
    if (!formData.track_codes) newErrors.track_codes = 'Track is required';
    if (!formData.level) newErrors.level = 'Level is required';
    if (!formData.steps?.length) newErrors.steps = 'At least one step is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save recipe:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-200">
                {recipe ? 'Edit Recipe' : 'Create New Recipe'}
              </h2>
              <div className="flex items-center gap-2">
                {onPreview && (
                  <Button variant="ghost" onClick={handlePreview} className="text-slate-400 hover:text-slate-200">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Basic Information */}
                <Card className="p-6 border-slate-700/50 bg-slate-800/30">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          errors.title ? 'border-red-500' : 'border-slate-700/50'
                        }`}
                        placeholder="Recipe title"
                      />
                      {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Skill Code *</label>
                      <input
                        type="text"
                        value={formData.skill_codes?.[0] || ''}
                        onChange={(e) => updateField('skill_codes', [e.target.value])}
                        className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          errors.skill_codes ? 'border-red-500' : 'border-slate-700/50'
                        }`}
                        placeholder="log_parsing"
                      />
                      {errors.skill_codes && <p className="text-red-400 text-sm mt-1">{errors.skill_codes}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Track *</label>
                      <select
                        value={formData.track_codes || 'defender'}
                        onChange={(e) => updateField('track_codes', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        {TRACK_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Level *</label>
                      <select
                        value={formData.level || 'beginner'}
                        onChange={(e) => updateField('level', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        {LEVEL_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                      <select
                        value={formData.difficulty || 'beginner'}
                        onChange={(e) => updateField('difficulty', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        {DIFFICULTY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={formData.expected_duration_minutes || 20}
                        onChange={(e) => updateField('expected_duration_minutes', parseInt(e.target.value) || 20)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Source Type</label>
                      <select
                        value={formData.source_type || 'manual'}
                        onChange={(e) => updateField('source_type', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        {SOURCE_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        errors.description ? 'border-red-500' : 'border-slate-700/50'
                      }`}
                      placeholder="Describe what this recipe teaches..."
                    />
                    {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                  </div>
                </Card>

                {/* Prerequisites */}
                <Card className="p-6 border-slate-700/50 bg-slate-800/30">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Prerequisites</h3>
                  <ArrayInputField
                    items={formData.prerequisites || []}
                    onAdd={(item) => addArrayItem('prerequisites', item)}
                    onRemove={(index) => removeArrayItem('prerequisites', index)}
                    placeholder="Add prerequisite knowledge or tools..."
                  />
                </Card>

                {/* Tools & Environment */}
                <Card className="p-6 border-slate-700/50 bg-slate-800/30">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Tools & Environment</h3>
                  <ArrayInputField
                    items={formData.tools_and_environment || []}
                    onAdd={(item) => addArrayItem('tools_and_environment', item)}
                    onRemove={(index) => removeArrayItem('tools_and_environment', index)}
                    placeholder="Add tools, software, or environment requirements..."
                  />
                </Card>

                {/* Inputs */}
                <Card className="p-6 border-slate-700/50 bg-slate-800/30">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Inputs</h3>
                  <ArrayInputField
                    items={formData.inputs || []}
                    onAdd={(item) => addArrayItem('inputs', item)}
                    onRemove={(index) => removeArrayItem('inputs', index)}
                    placeholder="Add data, files, or access requirements..."
                  />
                </Card>

                {/* Steps */}
                <Card className="p-6 border-slate-700/50 bg-slate-800/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-200">Steps *</h3>
                    <Button onClick={addStep} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </div>

                  {formData.steps?.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-4 p-4 border border-slate-700/50 rounded-lg bg-slate-800/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-200">Step {step.step_number}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Instruction</label>
                          <textarea
                            value={step.instruction || ''}
                            onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="Describe what to do..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Expected Outcome</label>
                          <textarea
                            value={step.expected_outcome || ''}
                            onChange={(e) => updateStep(index, 'expected_outcome', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="What should happen when this step is completed..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Evidence Hint</label>
                          <input
                            type="text"
                            value={step.evidence_hint || ''}
                            onChange={(e) => updateStep(index, 'evidence_hint', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="Screenshot, log output, or other evidence..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {errors.steps && <p className="text-red-400 text-sm">{errors.steps}</p>}
                </Card>

                {/* Validation Checks */}
                <Card className="p-6 border-slate-700/50 bg-slate-800/30">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Validation Checks</h3>
                  <ArrayInputField
                    items={formData.validation_checks || []}
                    onAdd={(item) => addArrayItem('validation_checks', item)}
                    onRemove={(index) => removeArrayItem('validation_checks', index)}
                    placeholder="Add validation questions or checks..."
                  />
                </Card>

                {/* Tags */}
                <Card className="p-6 border-slate-700/50 bg-slate-800/30">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Tags</h3>
                  <ArrayInputField
                    items={formData.tags || []}
                    onAdd={(item) => addArrayItem('tags', item)}
                    onRemove={(index) => removeArrayItem('tags', index)}
                    placeholder="Add tags for better discoverability..."
                  />
                </Card>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
              <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-200">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {recipe ? 'Update Recipe' : 'Create Recipe'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper component for array input fields
function ArrayInputField({
  items,
  onAdd,
  onRemove,
  placeholder
}: {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          placeholder={placeholder}
        />
        <Button onClick={handleAdd} size="sm" disabled={!inputValue.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="outline"
              className="bg-slate-700/50 border-slate-600 text-slate-300 pr-1"
            >
              {item}
              <button
                onClick={() => onRemove(index)}
                className="ml-2 text-slate-400 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
