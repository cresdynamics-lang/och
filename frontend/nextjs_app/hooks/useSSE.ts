import { useEffect, useRef, useCallback } from 'react';

interface SSEEvent {
  type: string;
  data: any;
}

interface UseSSEOptions {
  url: string;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useSSE({
  url,
  onEvent,
  onError,
  onOpen,
  onClose,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            type: event.type || 'message',
            data
          };
          onEvent?.(sseEvent);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
        onError?.(error);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.log('Max reconnection attempts reached');
          onClose?.();
        }
      };

      // Listen for specific event types
      const eventTypes = ['notification_new', 'next_actions_updated', 'summary_updated', 'connected'];

      eventTypes.forEach(eventType => {
        eventSourceRef.current?.addEventListener(eventType, (event: any) => {
          try {
            const data = JSON.parse(event.data);
            const sseEvent: SSEEvent = {
              type: eventType,
              data
            };
            onEvent?.(sseEvent);
          } catch (error) {
            console.error(`Failed to parse ${eventType} event:`, error);
          }
        });
      });

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      onError?.(error as Event);
    }
  }, [url, onEvent, onError, onOpen, onClose, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    onClose?.();
  }, [onClose]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Return connection status and control functions
  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect,
    disconnect
  };
}
