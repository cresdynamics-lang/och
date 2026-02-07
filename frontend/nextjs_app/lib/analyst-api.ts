/**
 * Analyst Dashboard API endpoints and hooks
 */

export const ANALYST_ENDPOINTS = {
  priorities: (userId: string) => `/api/analyst/${userId}/priorities`,
  labFeed: (userId: string) => `/api/analyst/${userId}/lab/feed`,
  progress: (userId: string) => `/api/analyst/${userId}/progress`,
  metrics: (userId: string) => `/api/analyst/${userId}/metrics`,
  labStream: (userId: string) => `/api/analyst/${userId}/stream`,
  // Content Integration Engine
  content: (userId: string) => `/api/analyst/${userId}/content`,
  progressAdvance: (userId: string) => `/api/analyst/${userId}/progress/advance`,
  quizStart: (userId: string, quizId: string) => `/api/analyst/${userId}/quiz/${quizId}/start`,
  // Advanced Tools
  toolsAnalyze: (userId: string) => `/api/analyst/${userId}/tools/analyze`,
  // Career Pipeline
  career: (userId: string) => `/api/analyst/${userId}/career`,
  careerApply: (userId: string) => `/api/analyst/${userId}/career/apply`,
  resumeGenerate: (userId: string) => `/api/analyst/${userId}/resume/generate`,
};

// API response types
export interface PriorityTask {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  time: string;
  subtitle?: string;
  ioc?: string;
  actions: string[];
}

export interface LabAlert {
  id: string;
  ioc: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProgressData {
  readiness: number;
  streak: number;
  careerMatch: number;
}

export interface MetricsData {
  detectionRate: number;
  falsePositives: number;
  responseTime: number;
}

// Mock data functions (replace with real API calls)
export const getMockPriorities = (): PriorityTask[] => [
  {
    id: 'lab-456',
    title: '#LAB-456 Ransomware IOC',
    severity: 'critical',
    time: 'LIVE',
    ioc: '192.168.4.17:445',
    actions: ['TRIAGE NOW', 'CASE', 'HUNT', 'DISMISS']
  },
  {
    id: 'quiz-001',
    title: 'Alert Triage Quiz',
    severity: 'high',
    time: 'Due 23:59',
    subtitle: 'Class Avg: 84%',
    actions: ['START QUIZ', 'RECIPE', 'MENTOR']
  },
  {
    id: 'mission-002',
    title: 'Threat Hunting Mission',
    severity: 'medium',
    time: '2 days left',
    subtitle: 'Advanced Persistence Techniques',
    actions: ['CONTINUE', 'RESOURCES', 'EXTEND']
  }
];

export const getMockLabFeed = (): LabAlert[] => [
  {
    id: 'alert-001',
    ioc: '192.168.4.17:445',
    type: 'IP:Port',
    severity: 'critical'
  },
  {
    id: 'alert-002',
    ioc: 'malware.exe',
    type: 'Filename',
    severity: 'high'
  },
  {
    id: 'alert-003',
    ioc: 'bad-domain.com',
    type: 'Domain',
    severity: 'medium'
  },
  {
    id: 'alert-004',
    ioc: 'suspicious-hash-123',
    type: 'Hash',
    severity: 'low'
  }
];

export const getMockProgress = (): ProgressData => ({
  readiness: 82,
  streak: 7,
  careerMatch: 92
});

export const getMockMetrics = (): MetricsData => ({
  detectionRate: 96.2,
  falsePositives: 2.1,
  responseTime: 4.2
});
