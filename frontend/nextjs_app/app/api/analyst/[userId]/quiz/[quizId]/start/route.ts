import { NextRequest, NextResponse } from 'next/server';
import type { QuizStartResponse } from '@/types/analyst-content';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; quizId: string }> }
) {
  try {
    const { userId, quizId } = await params;

    // RBAC Check
    const userRole = 'analyst';
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Mock quiz data based on quizId
    const quizData: Record<string, QuizStartResponse> = {
      'quiz-alert-triage': {
        sessionId: `session-${Date.now()}`,
        quizId: 'quiz-alert-triage',
        questions: [
          {
            id: 'q1',
            question: 'What is the primary function of a SIEM system?',
            options: [
              'To store user passwords securely',
              'To collect, analyze, and correlate security events',
              'To create backup copies of files',
              'To monitor network bandwidth usage',
            ],
            correctAnswer: 1,
            explanation: 'SIEM systems collect and analyze security events from various sources to identify potential security incidents.',
          },
          {
            id: 'q2',
            question: 'Which of the following is NOT a typical SIEM component?',
            options: [
              'Log collection agents',
              'Correlation engine',
              'Dashboard and reporting',
              'Password cracking tools',
            ],
            correctAnswer: 3,
            explanation: 'Password cracking tools are not part of a SIEM system. SIEM focuses on monitoring and analysis, not offensive security tools.',
          },
          {
            id: 'q3',
            question: 'What does MTTR stand for in cybersecurity?',
            options: [
              'Mean Time To Respond',
              'Maximum Threat Tolerance Rating',
              'Multi-Tier Threat Response',
              'Mean Time To Recovery',
            ],
            correctAnswer: 0,
            explanation: 'MTTR stands for Mean Time To Respond, measuring how quickly an organization can respond to security incidents.',
          },
          {
            id: 'q4',
            question: 'When triaging alerts, what should be prioritized first?',
            options: [
              'Alerts from internal IPs',
              'Alerts with high severity and active threats',
              'Alerts from known good sources',
              'Alerts older than 24 hours',
            ],
            correctAnswer: 1,
            explanation: 'High severity alerts with active threats should be prioritized as they pose immediate risk.',
          },
          {
            id: 'q5',
            question: 'What is an IOC (Indicator of Compromise)?',
            options: [
              'A type of encryption algorithm',
              'A piece of data that suggests a security breach',
              'A network protocol',
              'A firewall rule',
            ],
            correctAnswer: 1,
            explanation: 'An IOC is a piece of data that suggests a security breach has occurred or is occurring.',
          },
        ],
        timeLimit: 10, // 10 minutes
        startedAt: new Date().toISOString(),
      },
      'quiz-log-analysis': {
        sessionId: `session-${Date.now()}`,
        quizId: 'quiz-log-analysis',
        questions: [
          {
            id: 'q1',
            question: 'What is log analysis primarily used for?',
            options: [
              'To delete old logs',
              'To identify security events and anomalies',
              'To compress log files',
              'To backup data',
            ],
            correctAnswer: 1,
            explanation: 'Log analysis is used to identify security events, anomalies, and patterns in system logs.',
          },
          {
            id: 'q2',
            question: 'Which log type is most critical for detecting unauthorized access?',
            options: [
              'Application logs',
              'Authentication logs',
              'System logs',
              'Network logs',
            ],
            correctAnswer: 1,
            explanation: 'Authentication logs are critical for detecting unauthorized access attempts.',
          },
        ],
        timeLimit: 15,
        startedAt: new Date().toISOString(),
      },
    };

    const quiz = quizData[quizId] || quizData['quiz-alert-triage'];

    // Audit log
    console.log(`AUDIT: ${new Date().toISOString()} - ${userId} - quiz.start`, {
      quizId,
      sessionId: quiz.sessionId,
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Quiz start error:', error);
    return NextResponse.json(
      { error: 'Failed to start quiz' },
      { status: 500 }
    );
  }
}

