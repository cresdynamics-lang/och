'use client';

import { Target, FileText, BookOpen, Users, Clock, Star, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ContextPanelProps {
  contextType?: 'mission' | 'recipe' | 'module' | 'generic';
  contextData?: any;
  threadType?: string;
  threadId?: string;
}

function MissionContext({ mission }: { mission: any }) {
  return (
    <Card className="bg-slate-900/50 border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Target className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Mission Context</h3>
          <p className="text-slate-400 text-sm">Discussing this mission</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-white font-medium mb-2">{mission?.title || 'Mission Title'}</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {mission?.description || 'Mission description and objectives.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">
              {mission?.estimated_hours || 2}h estimated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">
              {mission?.difficulty || 'Medium'}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Mission
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RecipeContext({ recipe }: { recipe: any }) {
  return (
    <Card className="bg-slate-900/50 border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <FileText className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Recipe Discussion</h3>
          <p className="text-slate-400 text-sm">Getting help with this recipe</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-white font-medium mb-2">{recipe?.title || 'Recipe Title'}</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {recipe?.description || 'Recipe description and learning objectives.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-400 border-green-400">
            {recipe?.difficulty || 'Beginner'}
          </Badge>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {recipe?.duration || '15 min'}
          </Badge>
        </div>

        {recipe?.tags && recipe.tags.length > 0 && (
          <div>
            <p className="text-slate-400 text-sm mb-2">Tags:</p>
            <div className="flex flex-wrap gap-1">
              {recipe.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs text-slate-400 border-slate-600">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-700">
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Recipe
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ModuleContext({ module }: { module: any }) {
  return (
    <Card className="bg-slate-900/50 border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <BookOpen className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Module Context</h3>
          <p className="text-slate-400 text-sm">Discussing this curriculum module</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-white font-medium mb-2">{module?.title || 'Module Title'}</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {module?.description || 'Module description and learning objectives.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">
              {module?.estimated_duration_minutes || 60}min
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">
              {module?.lesson_count || 3} lessons
            </span>
          </div>
        </div>

        {module?.competencies && module.competencies.length > 0 && (
          <div>
            <p className="text-slate-400 text-sm mb-2">Competencies:</p>
            <div className="flex flex-wrap gap-1">
              {module.competencies.map((competency: string) => (
                <Badge key={competency} variant="outline" className="text-xs text-purple-400 border-purple-400">
                  {competency}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-700">
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Module
          </Button>
        </div>
      </div>
    </Card>
  );
}

function GenericContext({ threadType }: { threadType?: string }) {
  return (
    <Card className="bg-slate-900/50 border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-500/20 rounded-lg">
          <Users className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Discussion</h3>
          <p className="text-slate-400 text-sm">General conversation</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-slate-300 text-sm">
          This is a general discussion thread. Feel free to ask questions, share insights, and help fellow learners.
        </p>

        <div className="pt-4 border-t border-slate-700">
          <div className="text-center text-slate-400 text-sm">
            💬 Community Discussion
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ContextPanel({
  contextType = 'generic',
  contextData,
  threadType,
  threadId
}: ContextPanelProps) {
  const renderContext = () => {
    switch (contextType) {
      case 'mission':
        return <MissionContext mission={contextData} />;
      case 'recipe':
        return <RecipeContext recipe={contextData} />;
      case 'module':
        return <ModuleContext module={contextData} />;
      default:
        return <GenericContext threadType={threadType} />;
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-white font-semibold text-lg">Context</h2>
        <p className="text-slate-400 text-sm">Thread information and resources</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContext()}

        {/* Thread Info */}
        {threadId && (
          <Card className="bg-slate-900/50 border-slate-700 p-4 mt-4">
            <h4 className="text-white font-medium mb-2">Thread Info</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Type:</span>
                <Badge variant="outline" className="text-xs">
                  {threadType || 'generic'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>ID:</span>
                <span className="font-mono text-xs">{threadId.slice(-8)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
