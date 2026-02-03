'use client';

import useSWR from 'swr';
import { TaskCard } from './shared';
import { ANALYST_ENDPOINTS } from '@/lib/analyst-api';

interface PriorityTasksProps {
  userId: string;
}

export const PriorityTasks = ({ userId }: PriorityTasksProps) => {
  const { data: tasks, error, isLoading } = useSWR(ANALYST_ENDPOINTS.priorities(userId));

  return (
    <section className="space-y-4">
      <h2 className="font-inter text-2xl font-bold text-och-defender-blue tracking-tight">
        🎯 TODAY'S PRIORITIES
      </h2>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg">
          <div className="text-red-400 font-medium">Failed to load priorities</div>
          <div className="text-red-300 text-sm mt-1">Please try refreshing the page</div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-och-steel-grey/30 p-6 rounded-2xl animate-pulse">
              <div className="h-4 bg-och-steel-grey/50 rounded mb-3"></div>
              <div className="h-3 bg-och-steel-grey/50 rounded mb-2 w-3/4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-och-defender-blue/50 rounded w-20"></div>
                <div className="h-8 bg-och-steel-grey/50 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render task cards */}
      {tasks && !error && (
        <>
          {tasks.map((task: any) => (
            <TaskCard
              key={task.id}
              title={task.title}
              severity={task.severity}
              time={task.time}
              subtitle={task.subtitle}
              ioc={task.ioc}
              actions={task.actions}
            />
          ))}

          {tasks.length === 0 && (
            <div className="bg-och-steel-grey/30 p-6 rounded-2xl text-center">
              <div className="text-och-steel-grey">No priorities at this time</div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
