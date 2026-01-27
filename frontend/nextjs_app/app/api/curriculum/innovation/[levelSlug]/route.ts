import { NextRequest, NextResponse } from 'next/server';

// Mock Innovation level data - replace with database queries
const mockInnovationLevels = {
  'beginner': {
    slug: 'beginner',
    title: 'Beginner',
    description: 'Innovation foundations and basic cyber creativity',
    order_number: 1,
    estimated_duration_hours: 9,
    modules: [
      {
        slug: 'innovation-mindset-basics',
        title: 'Innovation Mindset Basics',
        description: 'Developing the creative thinking patterns for cyber innovation',
        order_number: 1,
        estimated_duration_minutes: 40,
        content_items: [
          {
            id: 'innovation-mindset-what-is-cyber-innovation',
            slug: 'what-is-cyber-innovation',
            title: 'What is Cyber Innovation?',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/what-is-cyber-innovation.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'innovation-mindset-problem-first-thinking',
            slug: 'problem-first-thinking',
            title: 'Problem-First Thinking',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/problem-first-thinking.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'innovation-mindset-observation-vs-assumption',
            slug: 'observation-vs-assumption',
            title: 'Observation vs Assumption',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/observation-vs-assumption.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'innovation-mindset-quiz',
            slug: 'innovation-foundations-quiz',
            title: 'Innovation Foundations Quiz',
            content_type: 'quiz',
            quiz_data: {
              questions: [
                {
                  id: 'q1',
                  type: 'mcq',
                  prompt: 'What is the first step in cyber innovation?',
                  choices: [
                    'Build a tool immediately',
                    'Spot a real problem that others miss',
                    'Read all research papers',
                    'Copy existing solutions'
                  ],
                  correctIndex: 1
                },
                {
                  id: 'q2',
                  type: 'mcq',
                  prompt: 'What does OSINT stand for?',
                  choices: [
                    'Online Security Intelligence Tools',
                    'Open Source Intelligence',
                    'Operational Security Integration Network',
                    'Open Systems Internet Technology'
                  ],
                  correctIndex: 1
                },
                {
                  id: 'q3',
                  type: 'mcq',
                  prompt: 'Why is problem-first thinking important in cybersecurity?',
                  choices: [
                    'It helps you build tools faster',
                    'It ensures you solve real problems instead of imagined ones',
                    'It makes you look more professional',
                    'It reduces the need for testing'
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
        slug: 'threat-research-basics',
        title: 'Threat Research Basics',
        description: 'Using OSINT and research to understand cyber threats',
        order_number: 2,
        estimated_duration_minutes: 50,
        content_items: [
          {
            id: 'threat-research-open-source-intelligence-osint',
            slug: 'open-source-intelligence-osint',
            title: 'Open Source Intelligence (OSINT)',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/open-source-intelligence-osint.mp4',
            duration_seconds: 480,
            order_number: 1,
            completed: false
          },
          {
            id: 'threat-research-reading-cves-advisories',
            slug: 'reading-cves-advisories',
            title: 'Reading CVEs & Security Advisories',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/reading-cves-advisories.mp4',
            duration_seconds: 420,
            order_number: 2,
            completed: false
          },
          {
            id: 'threat-research-trend-spotting-patterns',
            slug: 'trend-spotting-patterns',
            title: 'Trend Spotting Patterns',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/trend-spotting-patterns.mp4',
            duration_seconds: 360,
            order_number: 3,
            completed: false
          },
          {
            id: 'threat-research-quiz',
            slug: 'threat-research-basics-quiz',
            title: 'Threat Research Basics Quiz',
            content_type: 'quiz',
            quiz_data: { questions: [] },
            order_number: 4,
            completed: false,
            score: null
          }
        ]
      },
      {
        slug: 'tool-prototyping-intro',
        title: 'Tool Prototyping Introduction',
        description: 'Building and validating security tool ideas quickly',
        order_number: 3,
        estimated_duration_minutes: 45,
        content_items: [
          {
            id: 'tool-prototyping-no-code-security-tools',
            slug: 'no-code-security-tools',
            title: 'No-Code Security Tools',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/no-code-security-tools.mp4',
            duration_seconds: 360,
            order_number: 1,
            completed: false
          },
          {
            id: 'tool-prototyping-scripting-with-chatgpt',
            slug: 'scripting-with-chatgpt',
            title: 'Scripting with ChatGPT',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/scripting-with-chatgpt.mp4',
            duration_seconds: 480,
            order_number: 2,
            completed: false
          },
          {
            id: 'tool-prototyping-idea-validation-checklist',
            slug: 'idea-validation-checklist',
            title: 'Idea Validation Checklist',
            content_type: 'video',
            video_url: 'https://videos.och.local/innovation/beginner/idea-validation-checklist.mp4',
            duration_seconds: 300,
            order_number: 3,
            completed: false
          },
          {
            id: 'tool-prototyping-quiz',
            slug: 'prototyping-basics-quiz',
            title: 'Prototyping Basics Quiz',
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
      slug: 'innovation-beginner-assessment',
      title: 'Spot the Next Threat Trend',
      description: 'Use OSINT skills to identify an emerging threat that others might be missing.',
      missions: [
        { mission_slug: 'emerging-threats-osint' }
      ],
      recipes: ['innovation-osint-basics', 'innovation-idea-validation', 'innovation-threat-trend-spotting'],
      reflection_prompt: 'In 5–7 sentences, describe the emerging threat you discovered through OSINT research and why African organizations should care about it specifically.'
    }
  }
};

/**
 * GET /api/curriculum/innovation/[levelSlug]
 * Returns detailed information for a specific Innovation level including modules and content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { levelSlug: string } }
) {
  try {
    const levelSlug = params.levelSlug;
    const level = mockInnovationLevels[levelSlug as keyof typeof mockInnovationLevels];

    if (!level) {
      return NextResponse.json(
        { error: 'Innovation level not found' },
        { status: 404 }
      );
    }

    // In production, this would query the database for the specific level
    // const level = await getInnovationLevel(levelSlug);

    return NextResponse.json({
      level: {
        ...level,
        track_slug: 'innovation'
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch Innovation level:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Innovation level' },
      { status: 500 }
    );
  }
}
