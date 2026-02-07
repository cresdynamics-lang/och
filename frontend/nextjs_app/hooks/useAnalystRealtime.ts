'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface AnalystRealtimeData {
  alerts?: {
    count: number;
    mttr: string;
    accuracy: string;
  };
  career?: {
    views: number;
    newMatches: number;
  };
  content?: {
    newQuizDue: boolean;
  };
}

export const useAnalystRealtime = (userId: string) => {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Connect to SSE stream
    const eventSource = new EventSource(`/api/analyst/${userId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: AnalystRealtimeData = JSON.parse(event.data);

        // Update alerts
        if (data.alerts) {
          queryClient.invalidateQueries({ queryKey: ['analyst', userId, 'priorities'] });
          queryClient.invalidateQueries({ queryKey: ['analyst', userId, 'metrics'] });
        }

        // Update career
        if (data.career) {
          queryClient.invalidateQueries({ queryKey: ['analyst', userId, 'career'] });
        }

        // Update content
        if (data.content) {
          queryClient.invalidateQueries({ queryKey: ['analyst', userId, 'content'] });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // SSE will automatically reconnect
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [userId, queryClient]);
};

