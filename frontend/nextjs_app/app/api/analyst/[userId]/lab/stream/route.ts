import { NextRequest } from 'next/server';

// Generate realistic lab alerts for demo
const generateNewLabAlert = (userId: string) => {
  const alerts = [
    {
      type: 'new_alert',
      alert: {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ioc: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:445`,
        title: 'Suspicious SMB Connection',
        severity: 'high' as const,
        source: 'Network IDS - SMB Traffic',
        age: 'LIVE',
        primaryAction: 'TRIAGE NOW',
        sigmaRule: 'suspicious_smb',
        mitre: 'TA0008 Lateral Movement'
      }
    },
    {
      type: 'new_alert',
      alert: {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ioc: `malware-${Math.random().toString(36).substring(7)}.exe`,
        title: 'Unknown Executable Detected',
        severity: 'critical' as const,
        source: 'Endpoint Protection',
        age: 'LIVE',
        primaryAction: 'ISOLATE',
        sigmaRule: 'unknown_executable',
        mitre: 'TA0002 Execution'
      }
    },
    {
      type: 'new_alert',
      alert: {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ioc: `phish-${Math.random().toString(36).substring(7)}.com`,
        title: 'Phishing Domain Detected',
        severity: 'medium' as const,
        source: 'Email Gateway',
        age: '2 min ago',
        primaryAction: 'BLOCK',
        sigmaRule: 'phishing_domain',
        mitre: 'TA0001 Initial Access'
      }
    }
  ];

  return alerts[Math.floor(Math.random() * alerts.length)];
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectData = JSON.stringify({
        type: 'connected',
        message: 'Lab alert stream connected',
        timestamp: new Date().toISOString()
      });
      controller.enqueue(`data: ${connectData}\n\n`);

      // Send new alerts every 15-45 seconds (randomized)
      const sendAlert = () => {
        try {
          const newAlert = generateNewLabAlert(userId);
          const data = JSON.stringify(newAlert);
          controller.enqueue(`data: ${data}\n\n`);

          // Schedule next alert (15-45 seconds)
          const nextInterval = 15000 + Math.random() * 30000;
          setTimeout(sendAlert, nextInterval);
        } catch (error) {
          console.error('Error sending lab alert:', error);
          controller.close();
        }
      };

      // Start sending alerts
      const initialDelay = 5000 + Math.random() * 10000; // 5-15 seconds initial delay
      setTimeout(sendAlert, initialDelay);

      // Send heartbeat every 60 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(`data: ${heartbeat}\n\n`);
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 60000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
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
