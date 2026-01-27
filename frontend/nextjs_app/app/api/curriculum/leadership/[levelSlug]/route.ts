import { NextRequest, NextResponse } from 'next/server';

// Mock Leadership level data - replace with database queries
const mockLeadershipLevels = {
  'beginner': {
    slug: 'beginner',
    title: 'Beginner',
    description: 'Leadership foundations and basic cyber management skills',
    order_number: 1,
    estimated_duration_hours: 10,
    modules: [
      {
        slug: 'leadership-mindset-cyber',
        title: 'Leadership Mindset in Cyber',
        description: 'Developing the leadership mindset for cybersecurity roles',
        order_number: 1,
        estimated_duration_minutes: 50,
        content_items: [
          {
            id: 'leadership-mindset-cybersecurity-leadership-fundamentals',
            slug: 'cybersecurity-leadership-fundamentals',
            title: 'Cybersecurity Leadership Fundamentals',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/cybersecurity-leadership-fundamentals.mp4',
            duration_seconds: 420,
            order_number: 1,
            completed: false
          },
          {
            id: 'leadership-mindset-technical-leader-vs-manager',
            slug: 'technical-leader-vs-manager',
            title: 'Technical Leader vs Manager',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/technical-leader-vs-manager.mp4',
            duration_seconds: 360,
            order_number: 2,
            completed: false
          },
          {
            id: 'leadership-mindset-building-trust-tech-teams',
            slug: 'building-trust-tech-teams',
            title: 'Building Trust in Tech Teams',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/building-trust-tech-teams.mp4',
            duration_seconds: 480,
            order_number: 3,
            completed: false
          },
          {
            id: 'leadership-mindset-quiz',
            slug: 'leadership-foundations-quiz',
            title: 'Leadership Foundations Quiz',
            content_type: 'quiz',
            quiz_data: {
              questions: [
                {
                  id: 'q1',
                  type: 'mcq',
                  prompt: 'What is the PRIMARY role of a cybersecurity leader?',
                  choices: [
                    'Write all the code',
                    'Make technical decisions alone',
                    'Align security with business goals',
                    'Fix every vulnerability personally'
                  ],
                  correctIndex: 2
                },
                {
                  id: 'q2',
                  type: 'mcq',
                  prompt: 'Which builds trust FASTEST with a new team?',
                  choices: [
                    'Share your resume',
                    'Listen before speaking',
                    'Assign complex tasks',
                    'Set strict deadlines'
                  ],
                  correctIndex: 1
                }
              ]
            },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'communication-security',
        title: 'Communication in Cybersecurity',
        description: 'Mastering communication skills for security professionals',
        order_number: 2,
        estimated_duration_minutes: 55,
        content_items: [
          {
            id: 'communication-explaining-risk-non-tech-executives',
            slug: 'explaining-risk-non-tech-executives',
            title: 'Explaining Risk to Non-Tech Executives',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/explaining-risk-non-tech-executives.mp4',
            duration_seconds: 540,
            order_number: 1,
            completed: false
          },
          {
            id: 'communication-security-incident-communication',
            slug: 'security-incident-communication',
            title: 'Security Incident Communication',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/security-incident-communication.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'communication-stakeholder-mapping-cyber',
            slug: 'stakeholder-mapping-cyber',
            title: 'Stakeholder Mapping for Cyber',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/stakeholder-mapping-cyber.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'communication-quiz',
            slug: 'cyber-communication-basics-quiz',
            title: 'Cyber Communication Basics Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'team-dynamics-cyber',
        title: 'Team Dynamics in Cyber',
        description: 'Leading and managing cybersecurity teams effectively',
        order_number: 3,
        estimated_duration_minutes: 45,
        content_items: [
          {
            id: 'team-dynamics-managing-mixed-technical-teams',
            slug: 'managing-mixed-technical-teams',
            title: 'Managing Mixed Technical Teams',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/managing-mixed-technical-teams.mp4',
            duration_seconds: 480,
            order_number: 1,
            completed: false
          },
          {
            id: 'team-dynamics-motivating-soc-analysts',
            slug: 'motivating-soc-analysts',
            title: 'Motivating SOC Analysts',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/motivating-soc-analysts.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'team-dynamics-handling-technical-disagreements',
            slug: 'handling-technical-disagreements',
            title: 'Handling Technical Disagreements',
            content_type: 'video',
            video_url: 'https://videos.och.local/leadership/beginner/handling-technical-disagreements.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'team-dynamics-quiz',
            slug: 'team-leadership-basics-quiz',
            title: 'Team Leadership Basics Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      }
    ],
    assessment_block: {
      slug: 'leadership-beginner-assessment',
      title: 'First Leadership Challenge',
      description: 'Practice communicating a phishing incident to non-technical executives and handling team dynamics.',
      missions: [
        { mission_slug: 'phishing-incident-communication' }
      ],
      recipes: ['leadership-risk-communication', 'leadership-team-motivation'],
      reflection_prompt: 'In 5–7 sentences, describe what was hardest about explaining technical risk to business leaders and how you would approach it differently next time.'
    }
  }
};

/**
 * GET /api/curriculum/leadership/[levelSlug]
 * Returns detailed information for a specific Leadership level including modules and content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { levelSlug: string } }
) {
  try {
    const levelSlug = params.levelSlug;
    const level = mockLeadershipLevels[levelSlug as keyof typeof mockLeadershipLevels];

    if (!level) {
      return NextResponse.json(
        { error: 'Leadership level not found' },
        { status: 404 }
      );
    }

    // In production, this would query the database for the specific level
    // const level = await getLeadershipLevel(levelSlug);

    return NextResponse.json({
      level: {
        ...level,
        track_slug: 'leadership'
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch Leadership level:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Leadership level' },
      { status: 500 }
    );
  }
}
