import { NextRequest } from 'next/server';

// Mock real-time event generator
// In production, this would connect to a message queue or WebSocket system

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('data: {"type": "connected", "user_id": "' + userId + '"}\n\n'));

      // Mock real-time events (in production, this would listen to a message queue)
      const eventInterval = setInterval(() => {
        // Randomly send different types of events
        const events = [
          {
            type: 'notification_new',
            data: {
              id: `notif-${Date.now()}`,
              title: 'AI Coach: New Recommendation Available',
              body: 'Check out the latest personalized learning suggestions.',
              type: 'ai_coach',
              priority: 3,
              is_read: false,
              created_at: new Date().toISOString()
            }
          },
          {
            type: 'next_actions_updated',
            data: [
              {
                id: 'action-' + Date.now(),
                type: 'video',
                title: 'Updated Video Recommendation',
                subtitle: 'New content based on your progress',
                priority: 2,
                action_url: '/curriculum/defender',
                reason: 'Fresh recommendation from AI Coach'
              }
            ]
          },
          {
            type: 'summary_updated',
            data: {
              tracks_active: 2,
              missions_due_24h: 1,
              unread_mentor_messages: 4,
              ai_recommendations: 6
            }
          }
        ];

        // Send a random event (in production, this would be triggered by actual events)
        const randomEvent = events[Math.floor(Math.random() * events.length)];

        try {
          controller.enqueue(encoder.encode(`event: ${randomEvent.type}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(randomEvent.data)}\n\n`));
        } catch (error) {
          // Connection might be closed
          clearInterval(eventInterval);
        }
      }, 30000); // Send event every 30 seconds

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(eventInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
