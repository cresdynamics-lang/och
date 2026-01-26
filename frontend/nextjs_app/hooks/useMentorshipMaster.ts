'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorshipClient } from '@/services/mentorshipClient';
import { useAuth } from '@/hooks/useAuth';
import type { 
  MentorshipSession, 
  ChatMessage, 
  MentorPresence, 
  MentorshipFeedback 
} from '@/services/types/mentorship';

export type SMARTGoalStatus = 'draft' | 'proposed' | 'verified' | 'completed' | 'on_hold';

export interface SMARTGoal {
  id: string;
  title: string;
  description: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  status: SMARTGoalStatus;
  mentorFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  expertise: string[];
  bio: string;
  influenceIndex: number; // 0-100
  timezone: string;
}

export interface MentorshipStats {
  readinessScoreImpact: number;
  totalSessions: number;
  completedMilestones: number;
  activeGoals: number;
}

export function useMentorshipMaster() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // 1. Mentor Profile
  const mentorQuery = useQuery({
    queryKey: ['mentor', userId],
    queryFn: async () => {
      // Mock data for now
      return {
        id: 'mentor-1',
        name: 'Alex Rivera',
        avatar: '/mentors/alex.jpg',
        title: 'Senior Security Architect @ CyberSentinel',
        expertise: ['Threat Hunting', 'Malware Analysis', 'Zero Trust Architecture'],
        bio: '15+ years of experience in defensive security operations and incident response. Passionate about mentoring the next generation of African cyber defenders.',
        influenceIndex: 88,
        timezone: 'Africa/Nairobi'
      } as MentorProfile;
    },
    enabled: !!userId,
  });

  // 2. Sessions
  const sessionsQuery = useQuery({
    queryKey: ['mentorship-sessions', userId],
    queryFn: () => mentorshipClient.getUpcomingSessions(userId!.toString()),
    enabled: !!userId,
  });

  const requestSessionMutation = useMutation({
    mutationFn: async (data: { date: string; duration: number; topic: string }) => {
      // Mock API call
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-sessions', userId] });
    },
  });

  // 3. SMART Goals
  const goalsQuery = useQuery({
    queryKey: ['mentorship-goals', userId],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: 'goal-1',
          title: 'Master Packet Analysis',
          description: 'Become proficient in identifying common attack patterns in PCAP files.',
          status: 'verified',
          specific: 'Identify 5 different attack types in Wireshark',
          measurable: 'Completion of 3 analysis missions with 100% accuracy',
          achievable: 'Currently in Tier 2, basic networking knowledge confirmed',
          relevant: 'Directly impacts the Incident Responder career track',
          timeBound: 'By the end of Phase 3',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ] as SMARTGoal[];
    },
    enabled: !!userId,
  });

  // 4. Feedback & Notes
  const sessionNotesQuery = useQuery({
    queryKey: ['session-notes', userId],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: 'note-1',
          sessionId: 'session-prev-1',
          date: '2023-11-20',
          recap: 'Reviewed progress on Tier 2 missions.',
          challenges: 'Struggling with complex regex in log analysis.',
          wins: 'Successfully identified a lateral movement attempt in the mock lab.',
          nextActions: 'Complete the Regex for Defenders micro-skill; start the SIEM integration module.',
        }
      ];
    },
    enabled: !!userId,
  });

  // 5. Stats
  const statsQuery = useQuery({
    queryKey: ['mentorship-stats', userId],
    queryFn: async () => {
      return {
        readinessScoreImpact: +42,
        totalSessions: 8,
        completedMilestones: 3,
        activeGoals: 2
      } as MentorshipStats;
    },
    enabled: !!userId,
  });

  return {
    mentor: mentorQuery.data,
    isMentorLoading: mentorQuery.isLoading,
    sessions: sessionsQuery.data || [],
    isSessionsLoading: sessionsQuery.isLoading,
    goals: goalsQuery.data || [],
    isGoalsLoading: goalsQuery.isLoading,
    notes: sessionNotesQuery.data || [],
    stats: statsQuery.data,
    requestSession: requestSessionMutation.mutateAsync,
    isRequesting: requestSessionMutation.isPending,
  };
}

