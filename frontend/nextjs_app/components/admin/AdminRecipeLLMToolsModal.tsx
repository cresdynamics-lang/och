/**
 * AdminRecipeLLMToolsModal Component
 *
 * Modal for LLM-powered recipe generation and source ingestion tools.
 */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Save
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Recipe } from '@/services/types/recipes';

interface AdminRecipeLLMToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeGenerated?: (recipe: Recipe) => void;
  onSourceIngested?: (sourceId: string) => void;
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

export function AdminRecipeLLMToolsModal({
  isOpen,
  onClose,
  onRecipeGenerated,
  onSourceIngested
}: AdminRecipeLLMToolsModalProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'ingest'>('generate');

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
            className="fixed inset-4 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-w-4xl mx-auto max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-200">LLM Recipe Tools</h2>
              <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'generate'
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Generate Recipe
              </button>
              <button
                onClick={() => setActiveTab('ingest')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'ingest'
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Ingest Source
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'generate' ? (
                <RecipeGenerationForm onRecipeGenerated={onRecipeGenerated} />
              ) : (
                <SourceIngestionForm onSourceIngested={onSourceIngested} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Recipe Generation Form Component
function RecipeGenerationForm({ onRecipeGenerated }: { onRecipeGenerated?: (recipe: Recipe) => void }) {
  const [formData, setFormData] = useState({
    track_code: 'defender',
    level: 'beginner',
    skill_code: '',
    goal_description: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!formData.skill_code.trim() || !formData.goal_description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // This would call the actual API endpoint
      // For now, we'll simulate the response
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const recipe = await response.json();
      setGeneratedRecipe(recipe);
      onRecipeGenerated?.(recipe);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recipe');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveRecipe = () => {
    if (generatedRecipe) {
      // This would trigger saving the recipe to the database
      // For now, just close the modal
      onRecipeGenerated?.(generatedRecipe);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Generate Recipe with AI</h3>
        <p className="text-slate-400 text-sm">
          Use AI to create a structured recipe based on a skill goal description.
        </p>
      </div>

      {/* Form */}
      <Card className="p-6 border-slate-700/50 bg-slate-800/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Track</label>
            <select
              value={formData.track_code}
              onChange={(e) => setFormData(prev => ({ ...prev, track_code: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {TRACK_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {LEVEL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Skill Code *</label>
          <input
            type="text"
            value={formData.skill_code}
            onChange={(e) => setFormData(prev => ({ ...prev, skill_code: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="log_parsing, sigma_basics, etc."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Goal Description *</label>
          <textarea
            value={formData.goal_description}
            onChange={(e) => setFormData(prev => ({ ...prev, goal_description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="Describe what skill the learner should master and what practical outcome they should achieve..."
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || !formData.skill_code.trim() || !formData.goal_description.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Recipe...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Recipe
            </>
          )}
        </Button>
      </Card>

      {/* Generated Recipe Preview */}
      <AnimatePresence>
        {generatedRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-200">Generated Recipe</h4>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={handleSaveRecipe} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Recipe
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-slate-200">{generatedRecipe.title}</h5>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                      {generatedRecipe.track_code}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                      {generatedRecipe.skill_code}
                    </Badge>
                    <Badge variant="outline" className={`${
                      generatedRecipe.level === 'beginner' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                      generatedRecipe.level === 'intermediate' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
                      'bg-orange-500/20 border-orange-500/30 text-orange-300'
                    }`}>
                      {generatedRecipe.level}
                    </Badge>
                  </div>
                </div>

                <p className="text-slate-300">{generatedRecipe.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-slate-200 ml-2">{generatedRecipe.expected_duration_minutes} min</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Steps:</span>
                    <span className="text-slate-200 ml-2">{generatedRecipe.steps?.length || 0}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Source Ingestion Form Component
function SourceIngestionForm({ onSourceIngested }: { onSourceIngested?: (sourceId: string) => void }) {
  const [formData, setFormData] = useState({
    source_type: 'manual',
    track_code: 'defender',
    level: 'beginner',
    skill_code: '',
    source_content: '',
    source_url: '',
  });
  const [ingesting, setIngesting] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    if (!formData.skill_code.trim() || (!formData.source_content.trim() && !formData.source_url.trim())) {
      setError('Please fill in skill code and source content or URL');
      return;
    }

    setIngesting(true);
    setError(null);

    try {
      // First create a recipe source
      const sourceResponse = await fetch('/api/recipe-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.skill_code} source`,
          type: formData.source_type,
          config: {
            url: formData.source_url || null,
            content: formData.source_content || null,
          },
        }),
      });

      if (!sourceResponse.ok) {
        throw new Error('Failed to create source');
      }

      const source = await sourceResponse.json();

      // Then trigger ingestion
      const ingestResponse = await fetch(`/api/recipe-sources/${source.id}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_code: formData.track_code,
          level: formData.level,
          skill_code: formData.skill_code,
        }),
      });

      if (!ingestResponse.ok) {
        throw new Error('Failed to start ingestion');
      }

      const result = await ingestResponse.json();
      setIngestionResult(result);
      onSourceIngested?.(source.id);
    } catch (err: any) {
      setError(err.message || 'Failed to ingest source');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Ingest Recipe Source</h3>
        <p className="text-slate-400 text-sm">
          Extract and normalize recipes from external sources using AI processing.
        </p>
      </div>

      {/* Form */}
      <Card className="p-6 border-slate-700/50 bg-slate-800/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Source Type</label>
            <select
              value={formData.source_type}
              onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="manual">Manual Content</option>
              <option value="external_doc">External Document</option>
              <option value="lab_platform">Lab Platform</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Skill Code *</label>
            <input
              type="text"
              value={formData.skill_code}
              onChange={(e) => setFormData(prev => ({ ...prev, skill_code: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="log_parsing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Track</label>
            <select
              value={formData.track_code}
              onChange={(e) => setFormData(prev => ({ ...prev, track_code: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {TRACK_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {LEVEL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {formData.source_type === 'external_doc' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Source URL *</label>
            <input
              type="url"
              value={formData.source_url}
              onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="https://example.com/guide.pdf"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Source Content *</label>
            <textarea
              value={formData.source_content}
              onChange={(e) => setFormData(prev => ({ ...prev, source_content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Paste the raw content to be processed into recipes..."
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          onClick={handleIngest}
          disabled={ingesting || !formData.skill_code.trim() || (!formData.source_content.trim() && !formData.source_url.trim())}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {ingesting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Source...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Start Ingestion
            </>
          )}
        </Button>
      </Card>

      {/* Ingestion Result */}
      <AnimatePresence>
        {ingestionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="text-lg font-semibold text-slate-200">Ingestion Started</h4>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p><strong>Source ID:</strong> {ingestionResult.source_id}</p>
                <p><strong>Jobs Created:</strong> {ingestionResult.jobs_created || 0}</p>
                <p><strong>Status:</strong> Processing in background</p>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  Recipes will be generated automatically. Check the admin console in a few minutes to review and approve them.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
