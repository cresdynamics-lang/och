import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Mock data - replace with real database call
    const priorities = [
      {
        id: 'lab-456',
        title: '#LAB-456 Ransomware IOC',
        severity: 'critical' as const,
        time: 'LIVE',
        ioc: '192.168.4.17:445',
        actions: ['TRIAGE NOW', 'CASE', 'HUNT', 'DISMISS']
      },
      {
        id: 'quiz-001',
        title: 'Alert Triage Quiz',
        severity: 'high' as const,
        time: 'Due 23:59',
        subtitle: 'Class Avg: 84%',
        actions: ['START QUIZ', 'RECIPE', 'MENTOR']
      },
      {
        id: 'mission-002',
        title: 'Threat Hunting Mission',
        severity: 'medium' as const,
        time: '2 days left',
        subtitle: 'Advanced Persistence Techniques',
        actions: ['CONTINUE', 'RESOURCES', 'EXTEND']
      }
    ];

    return NextResponse.json(priorities);
  } catch (error) {
    console.error('Error fetching analyst priorities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch priorities' },
      { status: 500 }
    );
  }
}
