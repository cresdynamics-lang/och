/**
 * RecipeContentRenderer Component
 * 
 * Renders recipe content sections (intro, prerequisites, steps, validation).
 */
'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { RecipeContentSection, RecipeStep } from '@/services/types/recipes';
import { CheckCircle2, Play, Code, Info } from 'lucide-react';

interface RecipeContentRendererProps {
  content: {
    sections: RecipeContentSection[];
  };
}

export function RecipeContentRenderer({ content }: RecipeContentRendererProps) {
  return (
    <div className="space-y-8">
      {content.sections.map((section, index) => (
        <Card key={index} className="bg-slate-900/50 border-slate-800/50">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {section.type === 'intro' && <Info className="w-5 h-5 text-indigo-400" />}
              {section.type === 'prerequisites' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {section.type === 'steps' && <Play className="w-5 h-5 text-amber-400" />}
              {section.type === 'validation' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              <h2 className="text-2xl font-bold text-slate-200">{section.title}</h2>
            </div>

            {section.content && (
              <p className="text-slate-300 mb-4 leading-relaxed">{section.content}</p>
            )}

            {section.items && (
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.steps && (
              <div className="space-y-6 mt-6">
                {section.steps.map((step: RecipeStep) => (
                  <div key={step.step} className="border-l-2 border-indigo-500/30 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="defender" className="w-8 h-8 flex items-center justify-center p-0">
                        {step.step}
                      </Badge>
                      <h3 className="text-lg font-semibold text-slate-200">{step.title}</h3>
                    </div>
                    {step.explanation && (
                      <p className="text-slate-400 mb-3">{step.explanation}</p>
                    )}
                    {step.commands && step.commands.length > 0 && (
                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 mb-3">
                        <code className="text-sm text-emerald-400 font-mono">
                          {step.commands.map((cmd, idx) => (
                            <div key={idx}>{cmd}</div>
                          ))}
                        </code>
                      </div>
                    )}
                    {step.code && (
                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-4">
                        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto">
                          {step.code}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}


