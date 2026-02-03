'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Play } from 'lucide-react';

interface PriorityTasksCompactProps {
  userId: string;
}

interface Task {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  dueDate?: string;
}

export const PriorityTasksCompact = ({ userId }: PriorityTasksCompactProps) => {
  const { data: tasks, error, isLoading } = useSWR(
    `/api/analyst/${userId}/priorities`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return (
      <section className="space-y-2">
        <div className="h-6 bg-och-steel-grey/30 rounded animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-och-steel-grey/30 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-2">
        <div className="text-sm font-semibold text-och-signal-orange mb-2">
          PRIORITY TASKS
        </div>
        <div className="h-16 bg-red-400/10 border border-red-400/30 rounded-xl p-3 flex items-center">
          <div className="text-xs text-red-300">Failed to load priorities</div>
        </div>
      </section>
    );
  }

  const mockTasks: Task[] = [
    { id: 'lab-456', title: '#LAB-456 Ryuk', severity: 'critical', action: 'TRIAGE' },
    { id: 'quiz-due', title: 'Alert Quiz Due', severity: 'high', action: 'START' }
  ];

  const displayTasks = tasks || mockTasks;

  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-base tracking-tight text-och-defender-blue mb-2 uppercase">
        PRIORITY TASKS
      </h2>

      <div className="space-y-2">
        {displayTasks.slice(0, 3).map((task) => (
          <TaskCardCompact key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
};

interface TaskCardCompactProps {
  task: Task;
}

const TaskCardCompact = ({ task }: TaskCardCompactProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-och-signal-orange';
      case 'high':
        return 'bg-och-sahara-gold';
      case 'medium':
        return 'bg-och-cyber-mint';
      default:
        return 'bg-och-steel-grey';
    }
  };

  return (
    <div className="group h-16 p-3 rounded-xl border border-och-steel-grey/50 hover:border-och-defender-blue/50 hover:shadow-md bg-och-steel-grey/20 transition-all duration-150 overflow-hidden flex items-center">
      <div className={`w-2 h-2 rounded-full ${getSeverityColor(task.severity)} mr-3 flex-shrink-0`} />

      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate leading-tight text-white">
          {task.title}
        </div>
        <div className="text-xs text-och-steel-grey font-mono">
          {task.action}
        </div>
      </div>

      <Button size="sm" className="h-8 px-3 ml-2 text-xs font-medium bg-och-defender-blue hover:bg-och-defender-blue/90">
        GO
      </Button>
    </div>
  );
};
