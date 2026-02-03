import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId) {
    return new Response('User ID required', { status: 400 });
  }

  // Create a Server-Sent Events stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = {
        type: 'connected',
        message: 'Control center stream connected',
        timestamp: new Date().toISOString()
      };

      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);

      // Set up periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        const heartbeatData = {
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        };
        controller.enqueue(`data: ${JSON.stringify(heartbeatData)}\n\n`);
      }, 30000); // 30 seconds

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
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