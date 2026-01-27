import { NextRequest, NextResponse } from 'next/server';

// Mock Leadership curriculum data - replace with database queries
const mockLeadershipCurriculum = {
  track: {
    slug: 'leadership',
    title: 'Leadership Track',
    description: 'From SOC team lead to CISO: master technical leadership, executive communication, and strategic cyber governance.',
    icon_key: 'leadership'
  },
  levels: [
    {
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
          content_count: 4
        },
        {
          slug: 'communication-security',
          title: 'Communication in Cybersecurity',
          description: 'Mastering communication skills for security professionals',
          order_number: 2,
          estimated_duration_minutes: 55,
          content_count: 4
        },
        {
          slug: 'team-dynamics-cyber',
          title: 'Team Dynamics in Cyber',
          description: 'Leading and managing cybersecurity teams effectively',
          order_number: 3,
          estimated_duration_minutes: 45,
          content_count: 4
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
    },
    {
      slug: 'intermediate',
      title: 'Intermediate',
      description: 'Strategic leadership and operational management',
      order_number: 2,
      estimated_duration_hours: 12,
      modules: [
        {
          slug: 'cyber-security-strategy',
          title: 'Cyber Security Strategy',
          description: 'Developing and implementing cyber security strategy',
          order_number: 1,
          estimated_duration_minutes: 65,
          content_count: 4
        },
        {
          slug: 'hiring-security-talent',
          title: 'Hiring Security Talent',
          description: 'Recruiting, interviewing, and retaining cybersecurity professionals',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'security-governance-basics',
          title: 'Security Governance Basics',
          description: 'Establishing governance frameworks and board reporting',
          order_number: 3,
          estimated_duration_minutes: 55,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'leadership-intermediate-assessment',
        title: 'Build Your First Cyber Strategy',
        description: 'Develop a comprehensive cybersecurity strategy for a mid-sized African enterprise.',
        missions: [
          { mission_slug: 'cyber-strategy-development' }
        ],
        recipes: ['leadership-strategy-alignment', 'leadership-talent-acquisition', 'leadership-governance-framework'],
        reflection_prompt: 'In 6–8 sentences, describe how you would implement the cyber strategy you developed, including challenges you anticipate and how you would overcome them.'
      }
    },
    {
      slug: 'advanced',
      title: 'Advanced',
      description: 'Executive leadership and enterprise-level security management',
      order_number: 3,
      estimated_duration_hours: 13,
      modules: [
        {
          slug: 'ciso-strategic-leadership',
          title: 'CISO Strategic Leadership',
          description: 'Strategic leadership skills for Chief Information Security Officers',
          order_number: 1,
          estimated_duration_minutes: 75,
          content_count: 4
        },
        {
          slug: 'cyber-budget-finance',
          title: 'Cyber Budget and Finance',
          description: 'Financial management and ROI justification for security programs',
          order_number: 2,
          estimated_duration_minutes: 70,
          content_count: 4
        },
        {
          slug: 'cross-functional-leadership',
          title: 'Cross-Functional Leadership',
          description: 'Leading across organizational boundaries and functions',
          order_number: 3,
          estimated_duration_minutes: 65,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'leadership-advanced-assessment',
        title: 'CISO Board Presentation Simulation',
        description: 'Prepare and deliver a board presentation on cybersecurity strategy and budget for a major African corporation.',
        missions: [
          { mission_slug: 'ciso-board-presentation' }
        ],
        recipes: ['leadership-board-communication', 'leadership-budget-justification', 'leadership-crisis-management'],
        reflection_prompt: 'In 7–9 sentences, reflect on how your board presentation addressed the unique challenges of cybersecurity leadership in African enterprises.'
      }
    },
    {
      slug: 'mastery',
      title: 'Mastery',
      description: 'Transformational leadership and national-level cyber influence',
      order_number: 4,
      estimated_duration_hours: 15,
      modules: [
        {
          slug: 'cyber-culture-transformation',
          title: 'Cyber Culture Transformation',
          description: 'Building and transforming security culture in organizations',
          order_number: 1,
          estimated_duration_minutes: 80,
          content_count: 4
        },
        {
          slug: 'national-cyber-leadership',
          title: 'National Cyber Leadership',
          description: 'Leading cyber initiatives at national and regional levels',
          order_number: 2,
          estimated_duration_minutes: 85,
          content_count: 4
        },
        {
          slug: 'legacy-leadership-cyber',
          title: 'Legacy Leadership in Cyber',
          description: 'Building lasting impact and mentoring future leaders',
          order_number: 3,
          estimated_duration_minutes: 75,
          content_count: 4
        }
      ],
      assessment_block: {
        slug: 'leadership-mastery-assessment',
        title: 'Launch Your Cyber Leadership Initiative',
        description: 'Design and launch a transformational cyber leadership program for an African institution or region.',
        missions: [
          { mission_slug: 'cyber-leadership-program-launch' }
        ],
        recipes: ['leadership-culture-transformation', 'leadership-national-policy-influence', 'leadership-succession-planning'],
        reflection_prompt: 'In 8–10 sentences, describe your 3-year vision for African cybersecurity leadership and the specific initiatives you would launch to achieve it.'
      }
    }
  ]
};

/**
 * GET /api/curriculum/leadership
 * Returns the complete Leadership track curriculum structure
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would query the database for Leadership track data
    // const curriculum = await getTrackCurriculum('leadership');

    return NextResponse.json(mockLeadershipCurriculum);

  } catch (error: any) {
    console.error('Failed to fetch Leadership curriculum:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Leadership curriculum' },
      { status: 500 }
    );
  }
}
