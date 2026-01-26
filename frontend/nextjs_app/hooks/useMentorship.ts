/**
 * Mentorship Management Hook
 * Orchestrates mentor matching, sessions, goals, and feedback loops.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGateway } from '@/services/apiGateway';

export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type GoalStatus = 'draft' | 'in_progress' | 'verified';

export interface Mentor {
  id: string;
  name: string;
  avatar?: string;
  expertise: string[];
  track: string;
  bio: string;
  timezone: string;
  readiness_impact: number;
  cohort_id?: string;
  cohort_name?: string;
  assigned_at?: string;
  mentor_role?: string;
  assignment_type?: string;
}

export interface MentorshipSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  topic: string;
  notes?: string;
  meeting_link?: string;
}

export interface SmartGoal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  deadline: string;
  category: 'technical' | 'behavioral' | 'career';
  alignment: 'future-you' | 'cohort' | 'mission';
}

export interface MentorshipFeedback {
  id: string;
  session_id: string;
  rating: number; // 1-5
  comment: string;
  mentor_engagement: number;
}

export function useMentorship(userId?: string) {
  const queryClient = useQueryClient();

  // 1. Mentor Matching & Assignment - Fetch from backend
  const mentorQuery = useQuery({
    queryKey: ['mentorship', 'mentor', userId],
    queryFn: async () => {
      try {
        console.log('Fetching mentor for userId:', userId);
        // Fetch assigned mentor from backend
        const response = await apiGateway.get(`/mentorship/mentees/${userId}/mentor`);
        console.log('Mentor API response:', response);
        const resp = response as any;
        if (resp && resp.id) {
          const mentor: Mentor = {
            id: resp.id,
            name: resp.name || 'Mentor',
            avatar: resp.avatar || undefined,
            expertise: Array.isArray(resp.expertise) ? resp.expertise : [],
            track: resp.track || 'Mentor',
            bio: resp.bio || '',
            timezone: resp.timezone || 'Africa/Nairobi',
            readiness_impact: typeof resp.readiness_impact === 'number' ? resp.readiness_impact : 85.0,
            cohort_id: resp.cohort_id || undefined,
            cohort_name: resp.cohort_name || undefined,
            assigned_at: resp.assigned_at || undefined,
            mentor_role: resp.mentor_role || undefined,
            assignment_type: resp.assignment_type || undefined
          };
          console.log('Processed mentor data:', mentor);
          return mentor;
        }
      } catch (error: any) {
        // If mentor endpoint fails, log and return null
        console.error('Failed to fetch mentor:', error);
        // Log the full error for debugging
        if (error?.response?.data) {
          console.error('Error response data:', error.response.data);
        }
      }
      return null;
    },
    enabled: !!userId,
    retry: 2, // Retry twice on failure
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // 2. Scheduling & Session Management - Fetch from backend
  const sessionsQuery = useQuery({
    queryKey: ['mentorship', 'sessions', userId],
    queryFn: async () => {
      try {
        // Fetch sessions from backend
        const response = await apiGateway.get(`/mentorship/sessions?mentee_id=${userId}`);
        const backendSessions = Array.isArray(response) ? response : (((response as any)?.results) || []);
        
        return backendSessions.map((session: any) => ({
          id: session.id,
          mentor_id: session.mentor_id || session.mentor?.id,
          mentee_id: session.mentee_id || session.mentee?.id || userId,
          start_time: session.start_time || session.scheduled_at,
          end_time: session.end_time || session.ends_at,
          status: (session.status || 'pending') as SessionStatus,
          topic: session.topic || session.title || '',
          notes: session.notes || session.summary,
          meeting_link: session.meeting_link || session.meeting_url,
        })) as MentorshipSession[];
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return [] as MentorshipSession[];
      }
    },
    enabled: !!userId,
  });

  // 3. Goals & Milestones - Fetch from backend
  const goalsQuery = useQuery({
    queryKey: ['mentorship', 'goals', userId],
    queryFn: async () => {
      try {
        const response = await apiGateway.get<any>('/coaching/goals');
        const backendGoals = (response as any) || [];
        
        // Map backend Goal model to frontend SmartGoal interface
        return backendGoals.map((goal: any) => {
          // Map status: backend uses 'active'/'completed'/'abandoned', frontend uses 'draft'/'in_progress'/'verified'
          let status: GoalStatus = 'draft';
          if (goal.status === 'active') {
            status = goal.progress > 0 ? 'in_progress' : 'draft';
          } else if (goal.status === 'completed') {
            status = 'verified';
          }
          
          // Determine category from title/description (fallback to technical)
          let category: 'technical' | 'behavioral' | 'career' = 'technical';
          const titleLower = (goal.title || '').toLowerCase();
          const descLower = (goal.description || '').toLowerCase();
          if (titleLower.includes('communication') || titleLower.includes('leadership') || 
              descLower.includes('communication') || descLower.includes('leadership')) {
            category = 'behavioral';
          } else if (titleLower.includes('career') || descLower.includes('career')) {
            category = 'career';
          }
          
          // Determine alignment (default to mission)
          let alignment: 'future-you' | 'cohort' | 'mission' = 'mission';
          
          return {
            id: goal.id,
            title: goal.title,
            description: goal.description || '',
            status,
            deadline: goal.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            category,
            alignment,
          } as SmartGoal;
        });
      } catch (error) {
        console.error('Failed to fetch goals:', error);
        return [] as SmartGoal[];
      }
    },
    enabled: !!userId,
  });

  // Mutations
  const scheduleSession = useMutation({
    mutationFn: async (input: { 
      title: string;
      description?: string;
      preferred_date: string;
      duration_minutes: number;
      type?: string;
    }) => {
      const response = await apiGateway.post('/mentorship/sessions/request', {
        title: input.title,
        description: input.description || '',
        preferred_date: input.preferred_date,
        duration_minutes: input.duration_minutes,
        type: input.type || 'one_on_one',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'sessions', userId] });
    },
  });

  const updateGoalStatus = useMutation({
    mutationFn: async ({ goalId, status }: { goalId: string; status: GoalStatus }) => {
      return { success: true, goalId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'goals', userId] });
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async (feedback: Omit<MentorshipFeedback, 'id'>) => {
      return { success: true, id: 'fb-123' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'sessions', userId] });
    },
  });

  return {
    mentor: mentorQuery.data,
    sessions: sessionsQuery.data || [],
    goals: goalsQuery.data || [],
    isLoading: mentorQuery.isLoading || sessionsQuery.isLoading || goalsQuery.isLoading,
    scheduleSession,
    updateGoalStatus,
    submitFeedback,
    refetchAll: () => {
      mentorQuery.refetch();
      sessionsQuery.refetch();
      goalsQuery.refetch();
    }
  };
}


