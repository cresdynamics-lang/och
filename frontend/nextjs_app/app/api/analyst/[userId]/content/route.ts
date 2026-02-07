import { NextRequest, NextResponse } from 'next/server';
import type { AnalystContent } from '@/types/analyst-content';

// Mock data generator for analyst content
const getMockContent = (userId: string): AnalystContent => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  return {
    trackProgress: {
      currentLevel: 1,
      percentComplete: 0.68,
      videosCompleted: 12,
      videosTotal: 18,
      quizzesCompleted: 9,
      quizzesTotal: 12,
    },
    pending: {
      nextVideo: {
        id: 'video-siem-querying',
        title: 'SIEM Querying',
        duration: '7min',
        url: '/videos/siem-querying.mp4',
        thumbnailUrl: '/thumbnails/siem-querying.jpg',
      },
      quizzes: [
        {
          id: 'quiz-alert-triage',
          title: 'Alert Triage',
          due: tomorrow.toISOString(),
          classAvg: 0.84,
          isUrgent: true, // Due within 24h
        },
        {
          id: 'quiz-log-analysis',
          title: 'Log Analysis Basics',
          due: dayAfter.toISOString(),
          classAvg: 0.76,
          isUrgent: false,
        },
      ],
      recipes: [
        {
          level: 1,
          title: 'IOC Hunting',
          status: 'available',
        },
        {
          level: 1,
          title: 'Threat Detection',
          status: 'completed',
        },
        {
          level: 2,
          title: 'Advanced Persistence',
          status: 'locked',
        },
      ],
    },
    defenderTrack: [
      {
        level: 1,
        title: 'Level 1: Fundamentals',
        isUnlocked: true,
        recipes: [
          {
            id: 'recipe-ioc-hunting',
            title: 'IOC Hunting',
            videoUrl: '/videos/ioc-hunting.mp4',
            status: 'available',
            description: 'Learn to identify Indicators of Compromise',
          },
          {
            id: 'recipe-threat-detection',
            title: 'Threat Detection',
            videoUrl: '/videos/threat-detection.mp4',
            status: 'completed',
            description: 'Detect threats in network traffic',
          },
          {
            id: 'recipe-log-analysis',
            title: 'Log Analysis',
            quizId: 'quiz-log-analysis',
            status: 'available',
            description: 'Analyze security logs effectively',
          },
          {
            id: 'recipe-alert-triage',
            title: 'Alert Triage',
            quizId: 'quiz-alert-triage',
            status: 'available',
            description: 'Prioritize and triage security alerts',
          },
          {
            id: 'recipe-siem-basics',
            title: 'SIEM Basics',
            videoUrl: '/videos/siem-basics.mp4',
            status: 'completed',
            description: 'Introduction to SIEM systems',
          },
        ],
      },
      {
        level: 2,
        title: 'Level 2: Intermediate',
        isUnlocked: false, // Requires 82%+ readiness
        recipes: [
          {
            id: 'recipe-advanced-persistence',
            title: 'Advanced Persistence',
            status: 'locked',
            description: 'Detect advanced persistence techniques',
          },
          {
            id: 'recipe-malware-analysis',
            title: 'Malware Analysis',
            status: 'locked',
            description: 'Analyze malware samples',
          },
          {
            id: 'recipe-network-forensics',
            title: 'Network Forensics',
            status: 'locked',
            description: 'Forensic analysis of network traffic',
          },
          {
            id: 'recipe-incident-response',
            title: 'Incident Response',
            status: 'locked',
            description: 'Respond to security incidents',
          },
          {
            id: 'recipe-threat-hunting',
            title: 'Threat Hunting',
            status: 'locked',
            description: 'Proactive threat hunting',
          },
        ],
      },
      {
        level: 3,
        title: 'Level 3: Advanced',
        isUnlocked: false,
        recipes: [
          {
            id: 'recipe-apt-detection',
            title: 'APT Detection',
            status: 'locked',
            description: 'Detect Advanced Persistent Threats',
          },
          {
            id: 'recipe-zero-day-analysis',
            title: 'Zero-Day Analysis',
            status: 'locked',
            description: 'Analyze zero-day vulnerabilities',
          },
          {
            id: 'recipe-cloud-security',
            title: 'Cloud Security',
            status: 'locked',
            description: 'Security in cloud environments',
          },
          {
            id: 'recipe-iot-security',
            title: 'IoT Security',
            status: 'locked',
            description: 'Secure IoT devices',
          },
          {
            id: 'recipe-red-team-tactics',
            title: 'Red Team Tactics',
            status: 'locked',
            description: 'Understand attacker tactics',
          },
        ],
      },
      {
        level: 4,
        title: 'Level 4: Expert',
        isUnlocked: false,
        recipes: [
          {
            id: 'recipe-advanced-threat-intel',
            title: 'Advanced Threat Intel',
            status: 'locked',
            description: 'Advanced threat intelligence',
          },
          {
            id: 'recipe-forensics-mastery',
            title: 'Forensics Mastery',
            status: 'locked',
            description: 'Master digital forensics',
          },
          {
            id: 'recipe-penetration-testing',
            title: 'Penetration Testing',
            status: 'locked',
            description: 'Ethical hacking and pen testing',
          },
          {
            id: 'recipe-security-architecture',
            title: 'Security Architecture',
            status: 'locked',
            description: 'Design secure systems',
          },
          {
            id: 'recipe-leadership',
            title: 'SOC Leadership',
            status: 'locked',
            description: 'Lead security operations',
          },
        ],
      },
    ],
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // RBAC Check - would be implemented with proper auth
    const userRole = 'analyst'; // Mock - would come from JWT/auth
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied. Analyst role required.' },
        { status: 403 }
      );
    }

    const content = getMockContent(userId);

    return NextResponse.json(content);
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

