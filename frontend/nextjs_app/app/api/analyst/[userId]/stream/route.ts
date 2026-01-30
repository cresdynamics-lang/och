import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connected',
        message: 'Lab feed stream connected',
        timestamp: new Date().toISOString()
      });
      controller.enqueue(`data: ${data}\n\n`);

      // Simulate real-time alerts (replace with real event sourcing)
      const interval = setInterval(() => {
        // Random chance to send a new alert
        if (Math.random() < 0.3) { // 30% chance every 5 seconds
          const alerts = [
            {
              id: `alert-${Date.now()}`,
              ioc: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              type: 'IP Address',
              severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
            },
            {
              id: `alert-${Date.now()}`,
              ioc: `malicious-file-${Math.random().toString(36).substring(7)}.exe`,
              type: 'Filename',
              severity: 'high'
            },
            {
              id: `alert-${Date.now()}`,
              ioc: `suspicious-domain-${Math.random().toString(36).substring(7)}.com`,
              type: 'Domain',
              severity: 'medium'
            }
          ];

          const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];

          const data = JSON.stringify({
            type: 'new_alert',
            alert: randomAlert,
            timestamp: new Date().toISOString()
          });

          controller.enqueue(`data: ${data}\n\n`);
        }

        // Send heartbeat every 30 seconds
        if (Math.random() < 0.1) { // 10% chance
          const heartbeat = JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(`data: ${heartbeat}\n\n`);
        }
      }, 5000); // Check every 5 seconds

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
