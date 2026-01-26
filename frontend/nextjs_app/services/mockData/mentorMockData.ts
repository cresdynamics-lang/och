/**
 * Mock data for mentor dashboard features
 * Used until backend endpoints are fully implemented
 */

import type {
  AssignedMentee,
  MentorProfile,
  MissionSubmission,
  MissionReview,
  CapstoneProject,
  GroupMentorshipSession,
  MenteeGoal,
  MenteeFlag,
  MenteePerformance,
  TalentScopeMentorView,
  MentorInfluenceIndex,
} from '../types/mentor'

// Mock Assigned Mentees
export const mockMentees: AssignedMentee[] = [
  {
    id: 'mentee-1',
    user_id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    avatar_url: undefined,
    track: 'Cybersecurity Fundamentals',
    cohort: 'Cohort 2024-Q1',
    readiness_score: 75,
    readiness_label: 'Ready for Intermediate',
    risk_level: 'low',
    last_activity_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    missions_completed: 12,
    subscription_tier: 'professional',
    assigned_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: 'mentee-2',
    user_id: 'user-2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    avatar_url: undefined,
    track: 'Penetration Testing',
    cohort: 'Cohort 2024-Q1',
    readiness_score: 45,
    readiness_label: 'Needs Support',
    risk_level: 'medium',
    last_activity_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    missions_completed: 5,
    subscription_tier: 'professional',
    assigned_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: 'mentee-3',
    user_id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    avatar_url: undefined,
    track: 'Security Operations',
    cohort: 'Cohort 2024-Q2',
    readiness_score: 88,
    readiness_label: 'Advanced Ready',
    risk_level: 'low',
    last_activity_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    missions_completed: 18,
    subscription_tier: 'professional',
    assigned_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: 'mentee-4',
    user_id: 'user-4',
    name: 'David Kim',
    email: 'david.kim@example.com',
    avatar_url: undefined,
    track: 'Incident Response',
    cohort: 'Cohort 2024-Q1',
    readiness_score: 32,
    readiness_label: 'At Risk',
    risk_level: 'high',
    last_activity_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    missions_completed: 3,
    subscription_tier: 'professional',
    assigned_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'flagged',
  },
]

// Mock Mentor Profile
export const mockMentorProfile: MentorProfile = {
  id: 'mentor-1',
  user_id: 'user-mentor-1',
  bio: 'Experienced cybersecurity professional with 10+ years in penetration testing and security operations. Passionate about mentoring the next generation of cyber talent.',
  expertise_tags: ['Penetration Testing', 'Security Operations', 'Incident Response', 'Network Security', 'Cloud Security'],
  availability: {
    timezone: 'America/New_York',
    available_hours: [
      { day: 'Monday', start: '09:00', end: '17:00' },
      { day: 'Wednesday', start: '09:00', end: '17:00' },
      { day: 'Friday', start: '09:00', end: '15:00' },
    ],
  },
  max_mentees: 20,
  current_mentees: 4,
  rating: 4.8,
  total_sessions: 156,
  created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
}

// Mock Mission Submissions
export const mockMissionSubmissions: MissionSubmission[] = [
  {
    id: 'submission-1',
    mission_id: 'mission-1',
    mission_title: 'Network Security Assessment',
    mentee_id: 'mentee-1',
    mentee_name: 'Sarah Johnson',
    mentee_email: 'sarah.johnson@example.com',
    submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending_review',
    submission_data: {
      answers: {
        q1: 'I identified 3 critical vulnerabilities in the network scan.',
        q2: 'The main security concern is unpatched systems.',
      },
      files: [
        {
          id: 'file-1',
          filename: 'network_scan_report.pdf',
          url: '#',
          file_type: 'application/pdf',
        },
      ],
      code_repository: 'https://github.com/sarahj/network-assessment',
      live_demo_url: 'https://demo.example.com/assessment',
    },
    tier_requirement: 'professional',
  },
  {
    id: 'submission-2',
    mission_id: 'mission-2',
    mission_title: 'SQL Injection Prevention',
    mentee_id: 'mentee-2',
    mentee_name: 'Michael Chen',
    mentee_email: 'michael.chen@example.com',
    submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending_review',
    submission_data: {
      answers: {
        q1: 'I implemented parameterized queries to prevent SQL injection.',
        q2: 'Added input validation and sanitization.',
      },
      files: [
        {
          id: 'file-2',
          filename: 'sql_prevention_code.py',
          url: '#',
          file_type: 'text/x-python',
        },
      ],
    },
    tier_requirement: 'professional',
  },
  {
    id: 'submission-3',
    mission_id: 'mission-3',
    mission_title: 'Security Policy Review',
    mentee_id: 'mentee-3',
    mentee_name: 'Emily Rodriguez',
    mentee_email: 'emily.rodriguez@example.com',
    submitted_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'pending_review',
    submission_data: {
      answers: {
        q1: 'Reviewed and updated 5 security policies.',
        q2: 'Identified gaps in access control policies.',
      },
      files: [
        {
          id: 'file-3',
          filename: 'policy_review.docx',
          url: '#',
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ],
    },
    tier_requirement: 'professional',
  },
]

// Mock Capstone Projects
export const mockCapstoneProjects: CapstoneProject[] = [
  {
    id: 'capstone-1',
    mentee_id: 'mentee-1',
    mentee_name: 'Sarah Johnson',
    title: 'Enterprise Security Monitoring System',
    description: 'A comprehensive security monitoring system with real-time threat detection and automated response capabilities.',
    submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending_scoring',
    project_url: 'https://demo.example.com/security-monitoring',
    repository_url: 'https://github.com/sarahj/security-monitoring',
    documentation_url: 'https://docs.example.com/security-monitoring',
  },
]

// Mock Group Sessions
export const mockGroupSessions: GroupMentorshipSession[] = [
  {
    id: 'session-1',
    mentor_id: 'mentor-1',
    title: 'Advanced Penetration Testing Techniques',
    description: 'Deep dive into advanced penetration testing methodologies and tools.',
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 90,
    meeting_link: 'https://zoom.us/j/123456789',
    meeting_type: 'zoom',
    track_assignment: 'Penetration Testing',
    status: 'scheduled',
    attendance: [
      { mentee_id: 'mentee-1', mentee_name: 'Sarah Johnson', attended: false },
      { mentee_id: 'mentee-2', mentee_name: 'Michael Chen', attended: false },
      { mentee_id: 'mentee-3', mentee_name: 'Emily Rodriguez', attended: false },
    ],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'session-2',
    mentor_id: 'mentor-1',
    title: 'Incident Response Workshop',
    description: 'Hands-on workshop on incident response procedures and best practices.',
    scheduled_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 120,
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    meeting_type: 'google_meet',
    track_assignment: 'Incident Response',
    recording_url: 'https://recordings.example.com/session-2',
    transcript_url: 'https://transcripts.example.com/session-2',
    status: 'completed',
    attendance: [
      { mentee_id: 'mentee-1', mentee_name: 'Sarah Johnson', attended: true, joined_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), left_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString() },
      { mentee_id: 'mentee-2', mentee_name: 'Michael Chen', attended: false },
      { mentee_id: 'mentee-4', mentee_name: 'David Kim', attended: true, joined_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(), left_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 100 * 60 * 1000).toISOString() },
    ],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Mock Goals
export const mockGoals: MenteeGoal[] = [
  {
    id: 'goal-1',
    mentee_id: 'mentee-1',
    mentee_name: 'Sarah Johnson',
    goal_type: 'monthly',
    title: 'Complete 5 Advanced Missions',
    description: 'Complete 5 advanced-level missions by the end of the month to progress to the next track level.',
    target_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'goal-2',
    mentee_id: 'mentee-2',
    mentee_name: 'Michael Chen',
    goal_type: 'weekly',
    title: 'Improve Mission Submission Quality',
    description: 'Focus on improving code quality and documentation in mission submissions this week.',
    target_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'goal-3',
    mentee_id: 'mentee-3',
    mentee_name: 'Emily Rodriguez',
    goal_type: 'monthly',
    title: 'Lead a Community Discussion',
    description: 'Lead at least one community discussion on security best practices this month.',
    target_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    mentor_feedback: {
      feedback: 'Great progress! Keep up the excellent work on community engagement.',
      provided_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      version: 1,
    },
  },
]

// Mock Flags
export const mockFlags: MenteeFlag[] = [
  {
    id: 'flag-1',
    mentee_id: 'mentee-4',
    mentee_name: 'David Kim',
    flag_type: 'struggling',
    severity: 'high',
    description: 'Mentee has not submitted any missions in the past 2 weeks and has low engagement scores. May need additional support.',
    raised_by: 'mentor-1',
    raised_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
  },
  {
    id: 'flag-2',
    mentee_id: 'mentee-2',
    mentee_name: 'Michael Chen',
    flag_type: 'at_risk',
    severity: 'medium',
    description: 'Recent mission submissions show declining quality. May need guidance on best practices.',
    raised_by: 'mentor-1',
    raised_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
  },
]

// Mock TalentScope View
export const mockTalentScopeView: TalentScopeMentorView = {
  mentee_id: 'mentee-1',
  mentee_name: 'Sarah Johnson',
  ingested_signals: {
    mentor_evaluations: 12,
    habit_logs: 45,
    mission_scores: 18,
    reflection_sentiment: {
      positive: 35,
      neutral: 8,
      negative: 2,
    },
    community_engagement: 28,
  },
  skills_heatmap: {
    network_security: 85,
    penetration_testing: 78,
    incident_response: 72,
    security_operations: 80,
    cloud_security: 65,
    cryptography: 70,
  },
  behavioral_trends: [
    { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), engagement: 75, performance: 70, sentiment: 0.8 },
    { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), engagement: 78, performance: 72, sentiment: 0.82 },
    { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), engagement: 80, performance: 75, sentiment: 0.85 },
    { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), engagement: 82, performance: 78, sentiment: 0.88 },
    { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), engagement: 85, performance: 80, sentiment: 0.9 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), engagement: 88, performance: 82, sentiment: 0.92 },
  ],
  readiness_over_time: [
    { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), score: 60 },
    { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), score: 65 },
    { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), score: 68 },
    { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), score: 72 },
    { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), score: 75 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), score: 75 },
  ],
}

// Mock Influence Index with time-series data
export const mockInfluenceIndex: MentorInfluenceIndex = {
  mentor_id: 'mentor-1',
  overall_influence_score: 82,
  metrics: {
    total_feedback_given: 156,
    average_response_time_hours: 4.5,
    mentee_improvement_rate: 78,
    session_attendance_rate: 85,
    mission_approval_rate: 72,
  },
  correlation_data: {
    feedback_to_performance: 0.75,
    sessions_to_engagement: 0.68,
    reviews_to_mission_quality: 0.71,
  },
  period: {
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString(),
  },
}

// Mock time-series data for influence score over time
export const mockInfluenceTrendData = [
  { date: 'Sep 2', score: 68, feedback: 12, sessions: 3 },
  { date: 'Sep 9', score: 70, feedback: 15, sessions: 4 },
  { date: 'Sep 16', score: 72, feedback: 18, sessions: 5 },
  { date: 'Sep 23', score: 74, feedback: 20, sessions: 5 },
  { date: 'Sep 30', score: 75, feedback: 22, sessions: 6 },
  { date: 'Oct 7', score: 76, feedback: 25, sessions: 6 },
  { date: 'Oct 14', score: 77, feedback: 28, sessions: 7 },
  { date: 'Oct 21', score: 78, feedback: 30, sessions: 7 },
  { date: 'Oct 28', score: 79, feedback: 32, sessions: 8 },
  { date: 'Nov 4', score: 80, feedback: 35, sessions: 8 },
  { date: 'Nov 11', score: 81, feedback: 38, sessions: 9 },
  { date: 'Nov 18', score: 81, feedback: 40, sessions: 9 },
  { date: 'Nov 25', score: 82, feedback: 42, sessions: 10 },
  { date: 'Dec 1', score: 82, feedback: 45, sessions: 10 },
]

// Helper function to simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

