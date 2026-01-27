/**
 * Curriculum API hooks for OCH platform
 */
import { useState, useEffect } from 'react';

export interface CurriculumTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string;
  order_number: number;
  levels_count?: number;
  total_duration_hours?: number;
  user_enrollment?: {
    enrolled: boolean;
    current_level?: string;
    progress_percent?: number;
  };
}

export interface CurriculumLevel {
  id: string;
  slug: string;
  title: string;
  description: string;
  order_number: number;
  estimated_duration_hours: number;
  modules: CurriculumModule[];
  assessment_block?: AssessmentBlock;
}

export interface CurriculumModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  order_number: number;
  estimated_duration_minutes: number;
  supporting_recipes: string[];
  videos: CurriculumVideo[];
  quiz?: CurriculumQuiz;
}

export interface CurriculumVideo {
  id: string;
  slug: string;
  title: string;
  description: string;
  video_url: string;
  duration_seconds: number;
  order_number: number;
}

export interface CurriculumQuiz {
  id: string;
  slug: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text_input';
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface AssessmentBlock {
  id: string;
  slug: string;
  title: string;
  description: string;
  missions: AssessmentMission[];
  recipes: string[];
  reflection_prompt: string;
}

export interface AssessmentMission {
  id: string;
  title: string;
  description: string;
  mission_id: string;
}

export interface UserProgress {
  user_id: string;
  level_slug: string;
  videos_completed: number;
  quizzes_completed: number;
  assessment_completed: boolean;
  percent_complete: number;
}

export interface ContentProgressUpdate {
  content_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  quiz_score?: number;
}

/**
 * Hook to fetch all curriculum tracks
 */
export function useCurriculumTracks() {
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        // For now, return mock data until backend is available
        const mockTracks: CurriculumTrack[] = [
          {
            id: 'defender-track',
            slug: 'defender',
            title: 'Defender Track',
            description: 'Master cybersecurity defense from fundamentals to advanced threat hunting',
            thumbnail_url: 'https://placeholder.com/defender.jpg',
            order_number: 1,
            levels_count: 4,
            total_duration_hours: 48,
            user_enrollment: {
              enrolled: true,
              current_level: 'beginner',
              progress_percent: 75
            }
          },
          {
            id: 'offensive-track',
            slug: 'offensive',
            title: 'Offensive Security Track',
            description: 'Master penetration testing and red team operations',
            thumbnail_url: 'https://placeholder.com/offensive.jpg',
            order_number: 2,
            levels_count: 4,
            total_duration_hours: 50,
            user_enrollment: { enrolled: false }
          },
          {
            id: 'grc-track',
            slug: 'grc',
            title: 'Governance, Risk & Compliance Track',
            description: 'Master GRC frameworks and compliance management',
            thumbnail_url: 'https://placeholder.com/grc.jpg',
            order_number: 3,
            levels_count: 4,
            total_duration_hours: 40,
            user_enrollment: { enrolled: false }
          },
          {
            id: 'innovation-track',
            slug: 'innovation',
            title: 'Innovation & Cloud Security Track',
            description: 'Master cloud security and innovative security solutions',
            thumbnail_url: 'https://placeholder.com/innovation.jpg',
            order_number: 4,
            levels_count: 4,
            total_duration_hours: 48,
            user_enrollment: { enrolled: false }
          },
          {
            id: 'leadership-track',
            slug: 'leadership',
            title: 'Cyber Leadership Track',
            description: 'Develop executive cybersecurity leadership skills',
            thumbnail_url: 'https://placeholder.com/leadership.jpg',
            order_number: 5,
            levels_count: 4,
            total_duration_hours: 56,
            user_enrollment: { enrolled: false }
          },
          {
            id: 'offensive-track',
            slug: 'offensive',
            title: 'Offensive Security Track',
            description: 'Master penetration testing, red teaming, and adversary emulation',
            thumbnail_url: 'https://placeholder.com/offensive.jpg',
            order_number: 6,
            levels_count: 4,
            total_duration_hours: 50,
            user_enrollment: { enrolled: false }
          }
        ];

        setTracks(mockTracks);

        // TODO: Replace with actual API call when backend is available
        // const response = await fetch('/api/curriculum/tracks');
        // if (!response.ok) throw new Error('Failed to fetch tracks');
        // const data = await response.json();
        // setTracks(data);

      } catch (err: any) {
        setError(err.message || 'Failed to load curriculum tracks');
        console.error('Failed to fetch curriculum tracks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  return { tracks, loading, error };
}

/**
 * Hook to fetch Defender curriculum data
 */
export function useDefenderCurriculum() {
  const [data, setData] = useState<CurriculumLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefenderCurriculum = async () => {
      try {
        // TODO: Replace with actual API call when backend is available
        // const response = await fetch('/api/curriculum/defender');
        // if (!response.ok) throw new Error('Failed to fetch Defender curriculum');
        // const data = await response.json();
        // setData(data);

        // Mock data for now
        const mockData: CurriculumLevel[] = [
          {
            id: 'defender-beginner',
            slug: 'beginner',
            title: 'Beginner',
            description: 'Foundations of cybersecurity defense',
            order_number: 1,
            estimated_duration_hours: 12,
            modules: [],
            assessment_block: {
              id: 'beginner-assessment',
              slug: 'beginner-defender-assessment',
              title: 'Beginner Assessment',
              description: 'Test your understanding of basic cybersecurity defense concepts',
              missions: [
                { id: 'failed-logon-hunt', title: 'Failed Logon Investigation', description: 'Investigate suspicious login attempts', mission_id: 'failed-logon-hunt' }
              ],
              recipes: ['defender-log-parsing-basics', 'defender-siem-search-basics'],
              reflection_prompt: 'In 5-7 sentences, describe how you would investigate a spike in failed logons.'
            }
          },
          {
            id: 'defender-intermediate',
            slug: 'intermediate',
            title: 'Intermediate',
            description: 'Advanced log correlation and detection',
            order_number: 2,
            estimated_duration_hours: 16,
            modules: [],
            assessment_block: {
              id: 'intermediate-assessment',
              slug: 'intermediate-defender-assessment',
              title: 'Intermediate Assessment',
              description: 'Apply intermediate defender skills to complex scenarios',
              missions: [
                { id: 'advanced-threat-hunt', title: 'Advanced Threat Hunt', description: 'Hunt for sophisticated threats', mission_id: 'advanced-threat-hunt' }
              ],
              recipes: ['intermediate-defender-strategy'],
              reflection_prompt: 'Describe your approach to building effective detection rules.'
            }
          }
        ];

        setData(mockData);
      } catch (err: any) {
        setError(err.message || 'Failed to load Defender curriculum');
        console.error('Failed to fetch Defender curriculum:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDefenderCurriculum();
  }, []);

  return { data, loading, error };
}

/**
 * Hook to fetch a specific Defender level
 */
export function useDefenderLevel(levelSlug: string) {
  const [level, setLevel] = useState<CurriculumLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelSlug) return;

    const fetchLevel = async () => {
      try {
        // TODO: Replace with actual API call when backend is available
        // const response = await fetch(`/api/curriculum/defender/${levelSlug}`);
        // if (!response.ok) throw new Error('Failed to fetch level data');
        // const data = await response.json();
        // setLevel(data);

        // Mock data for now
        const mockLevel: CurriculumLevel = {
          id: `defender-${levelSlug}`,
          slug: levelSlug,
          title: levelSlug.charAt(0).toUpperCase() + levelSlug.slice(1),
          description: `Level description for ${levelSlug}`,
          order_number: levelSlug === 'beginner' ? 1 : levelSlug === 'intermediate' ? 2 : levelSlug === 'advanced' ? 3 : 4,
          estimated_duration_hours: 12,
          modules: [
            {
              id: `${levelSlug}-module-1`,
              slug: 'log-analysis-fundamentals',
              title: 'Log Analysis Fundamentals',
              description: 'Learn the basics of log analysis and event monitoring',
              order_number: 1,
              estimated_duration_minutes: 180,
              supporting_recipes: ['log-parsing-basics'],
              videos: [
                {
                  id: 'video-1',
                  slug: 'what-are-logs',
                  title: 'What Are Logs?',
                  description: 'Understanding log files and their importance in cybersecurity',
                  video_url: 'https://placeholder.com/video1.mp4',
                  duration_seconds: 300,
                  order_number: 1
                },
                {
                  id: 'video-2',
                  slug: 'event-viewer-walkthrough',
                  title: 'Event Viewer Walkthrough',
                  description: 'Exploring Windows Event Viewer for security events',
                  video_url: 'https://placeholder.com/video2.mp4',
                  duration_seconds: 480,
                  order_number: 2
                }
              ],
              quiz: {
                id: 'quiz-1',
                slug: 'log-basics-quiz',
                title: 'Log Basics Assessment',
                questions: [
                  {
                    id: 'q1',
                    question: 'What Event ID indicates a failed logon attempt?',
                    type: 'multiple_choice',
                    options: ['4624', '4625', '4634', '4648'],
                    correct_answer: '4625',
                    explanation: 'Event ID 4625 indicates an account failed to log on.'
                  }
                ]
              }
            }
          ],
          assessment_block: {
            id: `${levelSlug}-assessment`,
            slug: `${levelSlug}-defender-assessment`,
            title: `${levelSlug.charAt(0).toUpperCase() + levelSlug.slice(1)} Assessment`,
            description: `Test your understanding of ${levelSlug} cybersecurity defense concepts`,
            missions: [
              { id: 'sample-mission', title: 'Sample Mission', description: 'A sample defensive mission', mission_id: 'sample-mission' }
            ],
            recipes: [`${levelSlug}-defender-strategy`],
            reflection_prompt: 'Describe your approach to this level\'s concepts.'
          }
        };

        setLevel(mockLevel);
      } catch (err: any) {
        setError(err.message || 'Failed to load level data');
        console.error('Failed to fetch level data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
  }, [levelSlug]);

  return { level, loading, error };
}

/**
 * Hook to fetch user progress for Defender curriculum
 */
export function useDefenderProgress(userId?: string) {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProgress = async () => {
      try {
        // TODO: Replace with actual API call when backend is available
        // const response = await fetch(`/api/users/${userId}/curriculum/defender/progress`);
        // if (!response.ok) throw new Error('Failed to fetch progress');
        // const data = await response.json();
        // setProgress(data);

        // Mock progress data
        const mockProgress: UserProgress[] = [
          {
            user_id: userId,
            level_slug: 'beginner',
            videos_completed: 6,
            quizzes_completed: 2,
            assessment_completed: true,
            percent_complete: 85
          },
          {
            user_id: userId,
            level_slug: 'intermediate',
            videos_completed: 2,
            quizzes_completed: 1,
            assessment_completed: false,
            percent_complete: 35
          }
        ];

        setProgress(mockProgress);
      } catch (err: any) {
        setError(err.message || 'Failed to load progress data');
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  return { progress, loading, error };
}

/**
 * Hook to update content progress
 */
export function useContentProgress(userId?: string) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = async (contentId: string, status: ContentProgressUpdate['status'], quizScore?: number) => {
    if (!userId) return;

    setUpdating(true);
    setError(null);

    try {
      const payload: ContentProgressUpdate = {
        content_id: contentId,
        status,
        quiz_score: quizScore
      };

      // TODO: Replace with actual API call when backend is available
      console.log('Updating progress:', payload);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // const response = await fetch(`/api/users/${userId}/curriculum-progress`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      // if (!response.ok) throw new Error('Failed to update progress');

    } catch (err: any) {
      setError(err.message || 'Failed to update progress');
      console.error('Failed to update progress:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return { updateProgress, updating, error };
}
